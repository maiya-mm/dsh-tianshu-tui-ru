{
  description = "dsh-tianshu-tui — dev shell: node + npm toolchain (typescript/tsdown/vitest/oxlint come from package-lock, not from nix)";

  # Та же ревизия nixos-unstable, что уже залочена в ~/repos/nix-config
  # (flake.lock: inputs.nixpkgs.rev) — второй корень nixpkgs не тянем.
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/0bb2eedc20e4739f29e8045034f2828ad7054f8f";

  outputs =
    { nixpkgs, ... }:
    let
      # macOS-хост у пользователя тоже есть; devshell чисто userspace —
      # никаких linux-only пакетов, поэтому обе системы равноправны.
      systems = [
        "x86_64-linux"
        "aarch64-darwin"
      ];
      eachSystem = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = eachSystem (pkgs: {
        default = pkgs.mkShell {
          packages = [
            # package.json engines: >=24.9.0, а scripts/e2e-tui.sh требует
            # import.meta.main (node >=24.4); nodejs_24 = 24.21.0, npm идёт с ним.
            pkgs.nodejs_24
            # nix fmt / nix fmt -- --check flake.nix
            pkgs.nixfmt
          ];

          shellHook = ''
            echo "dsh-tianshu-tui: node $(node --version), npm $(npm --version)"
            echo "  npm ci --ignore-scripts && npm run typecheck|build|lint|test"
          '';
        };
      });

      formatter = eachSystem (pkgs: pkgs.nixfmt);
    };
}
