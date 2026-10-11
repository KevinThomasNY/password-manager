import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Center, useAnimations, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import lockModelUrl from "@/assets/password-manager-logo.glb?url";
import LockLogoFallback from "@/components/LockLogoFallback";
import {
  LOCK_LOGO_LAYOUTS,
  type LockLogoSize,
} from "@/components/lock-logo-layout";

const MODEL_SCALE = 1.2;
const LOGO_INDIGO = "#4F46E5";
const CAMERA_DISTANCE_WITH_GUTTER = 14.4;

interface AnimatedLockModelProps {
  isReady: boolean;
  onReady: () => void;
}

const AnimatedLockModel = ({ isReady, onReady }: AnimatedLockModelProps) => {
  const { scene, animations } = useGLTF(lockModelUrl);
  const hasReportedReady = useRef(false);
  const model = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      const normalizedMaterials = materials.map((sourceMaterial) => {
        if (object.name === "Lock_Body" || object.name === "Lock_Shackle") {
          return new THREE.MeshBasicMaterial({ color: LOGO_INDIGO });
        }

        if (object.name.startsWith("Status_Dot_")) {
          return new THREE.MeshBasicMaterial({ color: "#FFFFFF" });
        }

        return sourceMaterial.clone();
      });

      object.material = Array.isArray(object.material)
        ? normalizedMaterials
        : normalizedMaterials[0];
    });

    return clone;
  }, [scene]);
  const { actions } = useAnimations(animations, model);

  useFrame(() => {
    if (hasReportedReady.current) return;

    hasReportedReady.current = true;
    onReady();
  });

  useEffect(() => {
    if (!isReady) return;

    const activeActions = Object.values(actions).filter(Boolean);

    activeActions.forEach((action) => {
      action?.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    });

    return () => {
      activeActions.forEach((action) => action?.stop());
    };
  }, [actions, isReady]);

  return (
    <Center>
      <primitive object={model} scale={MODEL_SCALE} dispose={null} />
    </Center>
  );
};

interface AnimatedLockLogoProps {
  label?: string;
  size?: LockLogoSize;
}

const AnimatedLockLogo = ({
  label = "Animated Password Manager lock",
  size = "default",
}: AnimatedLockLogoProps) => {
  const [isModelReady, setIsModelReady] = useState(false);
  const handleModelReady = useCallback(() => setIsModelReady(true), []);
  const { canvasGutterClassName, frameClassName } = LOCK_LOGO_LAYOUTS[size];

  return (
    <div
      className={frameClassName}
      role="img"
      aria-label={label}
    >
      <div className={canvasGutterClassName}>
        <Canvas
          aria-hidden="true"
          camera={{
            fov: 30,
            near: 0.1,
            far: 50,
            position: [0, 0, CAMERA_DISTANCE_WITH_GUTTER],
          }}
          dpr={[1, 1.5]}
          fallback={null}
          frameloop="always"
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
            toneMapping: THREE.NoToneMapping,
          }}
          style={{ opacity: isModelReady ? 1 : 0 }}
        >
          <Suspense fallback={null}>
            <AnimatedLockModel
              isReady={isModelReady}
              onReady={handleModelReady}
            />
          </Suspense>
        </Canvas>
      </div>
      {!isModelReady && <LockLogoFallback />}
    </div>
  );
};

useGLTF.preload(lockModelUrl);

export default AnimatedLockLogo;
