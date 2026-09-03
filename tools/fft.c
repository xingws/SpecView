/* SIMD-friendly radix-2 FFT for SpecView.
 *
 * Fixed length N=2048 complex FFT, natural-order (bit-reversed input is
 * unscrambled first), running in-place on four independent transforms at a
 * time.  The four transforms are stored "lane-major": element (position k,
 * lane l) lives at index k*L + l, L=4.  Butterfly accesses are therefore 4
 * contiguous floats per operand, which clang vectorizes to wasm SIMD128
 * (compile with -msimd128 -O3).
 *
 * Twiddles match the JS original: w(k) = exp(-2*pi*i*k/N), index = q*step.
 * Tables are built in init() using imported cos/sin.
 */

typedef float f32;
typedef int i32;

#define N 2048
#define L 4

__attribute__((import_module("env"), import_name("cos"))) double cos(double);
__attribute__((import_module("env"), import_name("sin"))) double sin(double);

static unsigned short REV[N];
static f32 ROTR[N];           /* cos(-2*pi*k/N)  == cos(2*pi*k/N)  */
static f32 ROTI[N];           /* sin(-2*pi*k/N)  == -sin(2*pi*k/N) */
static f32 DRE[N * L];
static f32 DIM[N * L];

__attribute__((export_name("init")))
void init(void) {
  i32 j = 0;
  REV[0] = 0;
  for (i32 i = 1; i < N; i++) {
    i32 b = N >> 1;
    for (; j & b; b >>= 1) j ^= b;
    j ^= b;
    REV[i] = (unsigned short)j;
  }
  for (i32 k = 0; k < N; k++) {
    double a = -6.28318530717958647692 * (double)k / (double)N;
    ROTR[k] = (f32)cos(a);
    ROTI[k] = (f32)sin(a);
  }
}

__attribute__((export_name("fft")))
void fft(void) {
  /* bit-reversal swap, 4 lanes at once */
  for (i32 i = 1; i < N; i++) {
    i32 jj = REV[i];
    if (i < jj) {
      for (i32 l = 0; l < L; l++) {
        i32 a = i * L + l, b = jj * L + l;
        f32 t = DRE[a]; DRE[a] = DRE[b]; DRE[b] = t;
        t = DIM[a]; DIM[a] = DIM[b]; DIM[b] = t;
      }
    }
  }
  for (i32 len = 2; len <= N; len <<= 1) {
    i32 half = len >> 1;
    i32 step = N / len;
    for (i32 i = 0; i < N; i += len) {
      i32 tw = 0;
      for (i32 q = 0; q < half; q++) {
        f32 wR = ROTR[tw], wI = ROTI[tw];
        i32 a = i + q, b = i + half + q;
        for (i32 l = 0; l < L; l++) {
          i32 ai = a * L + l, bi = b * L + l;
          f32 tR = wR * DRE[bi] - wI * DIM[bi];
          f32 tI = wR * DIM[bi] + wI * DRE[bi];
          DRE[bi] = DRE[ai] - tR;
          DIM[bi] = DIM[ai] - tI;
          DRE[ai] += tR;
          DIM[ai] += tI;
        }
        tw += step;
      }
    }
  }
}

__attribute__((export_name("get_dre")))
f32 *get_dre(void) { return DRE; }

__attribute__((export_name("get_dim")))
f32 *get_dim(void) { return DIM; }
