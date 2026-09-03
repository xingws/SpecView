#!/usr/bin/env bash
# Build tools/fft.c into an embedded, base64-encoded WASM SIMD FFT module.
#
# The result is written as `fft.wasm.b64` (next to this script) and its text
# is pasted into index.html as SPEC_WASM_B64.  Because the artifact is
# committed, end users never need to run this script — index.html is a
# portable, self-contained file that runs on any OS.
#
# Requirements (only needed to regenerate the artifact):
#   - clang with a wasm32 target   (e.g. `nix shell nixpkgs#clang-unwrapped`… )
#   - wasm-ld  (e.g. `nix shell nixpkgs#lld`)
#
# Example (NixOS/nix):
#   nix shell nixpkgs#clang-unwrapped nixpkgs#lld \
#     --command bash tools/build-fft.sh
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
CC="${CC:-clang}"
out="$here/fft.wasm"

"$CC" --target=wasm32 -O3 -msimd128 -nostdlib \
  -Wl,--no-entry \
  -Wl,--export=init -Wl,--export=fft \
  -Wl,--export=get_dre -Wl,--export=get_dim \
  -Wl,--import-undefined \
  -o "$out" "$here/fft.c"

base64 -w0 "$out" > "$here/fft.wasm.b64"
echo "wrote $here/fft.wasm.b64 ($(wc -c < "$here/fft.wasm.b64") bytes)"
