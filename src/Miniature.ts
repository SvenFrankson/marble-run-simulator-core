namespace MarbleRunSimulatorCore {
    
    export class MiniatureTrack {
        public points: BABYLON.Vector3[] = [];
        public dist: number = Infinity;
    }

    export class MiniatureShape {
        public points: BABYLON.Vector3[] = [];
        public dist: number = Infinity;

        public static MakeNGon(c: BABYLON.Vector3, r: number, axis: BABYLON.Vector3, n: number): MiniatureShape {
            let tmp = BABYLON.Axis.X;
            if (Mummu.Angle(axis, tmp) < Math.PI / 100) {
                tmp = BABYLON.Axis.Y;
            }
            tmp = BABYLON.Vector3.Cross(axis, tmp).normalize().scaleInPlace(r);

            let shape = new MiniatureShape();
            shape.points.push(tmp.clone());
            for (let i = 0; i < n - 1; i++) {
                Mummu.RotateInPlace(tmp, axis, 2 * Math.PI / n);
                shape.points.push(tmp.clone());
            }
            shape.points.forEach(pt => {
                pt.addInPlace(c);
            });

            return shape;
        }
    }
}