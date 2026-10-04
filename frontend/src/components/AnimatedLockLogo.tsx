import { Suspense, useEffect, useMemo } from "react";
import { Center, useAnimations, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import fallbackLogo from "@/assets/navbar_icon.svg";
import lockModelUrl from "@/assets/password-manager-logo.glb?url";

const MODEL_SCALE = 0.9;
const LOGO_INDIGO = "#4F46E5";

const LogoFallback = () => (
  <img
    src={fallbackLogo}
    alt=""
    className="h-16 w-16"
    aria-hidden="true"
  />
);

const AnimatedLockModel = () => {
  const { scene, animations } = useGLTF(lockModelUrl);
  const model = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      const normalizedMaterials = materials.map((sourceMaterial) => {
        const material = sourceMaterial.clone();

        if (
          (object.name === "Lock_Body" || object.name === "Lock_Shackle") &&
          material instanceof THREE.MeshStandardMaterial
        ) {
          material.color.set(LOGO_INDIGO);
          material.metalness = 0.04;
          material.roughness = 0.3;
        }

        return material;
      });

      object.material = Array.isArray(object.material)
        ? normalizedMaterials
        : normalizedMaterials[0];
    });

    return clone;
  }, [scene]);
  const { actions } = useAnimations(animations, model);

  useEffect(() => {
    const activeActions = Object.values(actions).filter(Boolean);

    activeActions.forEach((action) => {
      action?.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    });

    return () => {
      activeActions.forEach((action) => action?.stop());
    };
  }, [actions]);

  return (
    <Center>
      <primitive object={model} scale={MODEL_SCALE} dispose={null} />
    </Center>
  );
};

const AnimatedLockLogo = () => (
  <div
    className="mx-auto h-28 w-32 pointer-events-none sm:h-32 sm:w-36"
    role="img"
    aria-label="Animated Password Manager lock"
  >
    <Canvas
      aria-hidden="true"
      camera={{ fov: 30, near: 0.1, far: 50, position: [0, 0, 12.75] }}
      dpr={[1, 1.5]}
      fallback={<LogoFallback />}
      frameloop="always"
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.NoToneMapping,
      }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[-4, 5, 6]} intensity={1.25} />
      <directionalLight
        position={[4, -1, 3]}
        intensity={0.35}
        color="#c7d2fe"
      />
      <Suspense fallback={null}>
        <AnimatedLockModel />
      </Suspense>
    </Canvas>
  </div>
);

useGLTF.preload(lockModelUrl);

export default AnimatedLockLogo;
