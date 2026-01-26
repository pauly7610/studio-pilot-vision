import { Composition } from "remotion";
import { MSIPDemo } from "./MSIPDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MSIPDemo"
        component={MSIPDemo}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
