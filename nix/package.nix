{
  git,
  lib,
  makeWrapper,
  nodejs_22,
  pnpm_10,
  stdenv,
  ...
}:
stdenv.mkDerivation (finalAttrs: {
  pname = "headplane";
  version = (builtins.fromJSON (builtins.readFile ../package.json)).version;
  src = ../.;

  nativeBuildInputs = [
    makeWrapper
    nodejs_22
    pnpm_10.configHook
    git
  ];

  dontCheckForBrokenSymlinks = true;

  pnpmDeps = pnpm_10.fetchDeps {
    inherit (finalAttrs) pname version src;
    hash = "sha256-GtpwQz7ngLpP+BubH6uaG1uUZsZdCQzvTI1WKBYU2T4=";
  };

  buildPhase = ''
    runHook preBuild
    pnpm build
    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall
    mkdir -p $out/{bin,share/headplane}
    cp -r build $out/share/headplane/
    sed -i "s;$PWD;../..;" $out/share/headplane/build/server/index.js
    makeWrapper ${lib.getExe nodejs_22} $out/bin/headplane \
        --chdir $out/share/headplane \
        --add-flags $out/share/headplane/build/server/index.js
    runHook postInstall
  '';
})
