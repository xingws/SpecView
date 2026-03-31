{
  description = "SpecView — Spectrogram viewer with audio classification";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        electron = pkgs.electron;

        specview = pkgs.stdenv.mkDerivation {
          pname = "specview";
          version = "1.0.0";

          src = ./.;

          nativeBuildInputs = [ pkgs.makeWrapper ];

          # No build step — just install the app files and create a wrapper
          dontBuild = true;
          dontConfigure = true;

          installPhase = ''
            runHook preInstall

            # Install app files
            mkdir -p $out/lib/specview
            cp $src/main.js $out/lib/specview/
            cp $src/index.html $out/lib/specview/
            cat > $out/lib/specview/package.json << 'PKGJSON'
            {"name":"specview","version":"1.0.0","main":"main.js"}
            PKGJSON

            # Create launcher script
            mkdir -p $out/bin
            makeWrapper ${electron}/bin/electron $out/bin/specview \
              --add-flags "$out/lib/specview"

            # Desktop entry
            mkdir -p $out/share/applications
            cat > $out/share/applications/specview.desktop << EOF
            [Desktop Entry]
            Name=SpecView
            Comment=Spectrogram viewer with audio classification
            Exec=$out/bin/specview %F
            Terminal=false
            Type=Application
            Categories=Audio;AudioVideo;Music;
            MimeType=audio/mpeg;audio/wav;audio/ogg;audio/flac;audio/x-wav;audio/x-flac;audio/mp4;
            EOF

            runHook postInstall
          '';

          meta = with pkgs.lib; {
            description = "Spectrogram viewer with audio classification (CED-tiny)";
            license = licenses.asl20;
            platforms = platforms.linux;
            mainProgram = "specview";
          };
        };
      in
      {
        packages.default = specview;
        packages.specview = specview;

        apps.default = {
          type = "app";
          program = "${specview}/bin/specview";
        };

        devShells.default = pkgs.mkShell {
          packages = [ electron ];
          shellHook = ''
            echo "Run: electron ."
          '';
        };
      }
    );
}
