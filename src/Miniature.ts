namespace MarbleRunSimulatorCore {
    
    export class MiniatureTrack {
        public points: BABYLON.Vector3[] = [];
        public color: BABYLON.Color4;
        public isPipe: boolean = false;
        public dist: number = Infinity;
    }

    export class MiniatureShape {
        public center: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public points: BABYLON.Vector3[] = [];
        public colorSlot: number = 0;
        public color: BABYLON.Color4;
        public dist: number = Infinity;
        public fill: boolean = true;

        public static MakeNGon(c: BABYLON.Vector3, r: number, axis: BABYLON.Vector3, n: number, fill: boolean): MiniatureShape {
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
                shape.center.addInPlace(pt);
            });
            shape.center.scaleInPlace(1 / shape.points.length);

            shape.fill = fill;
            
            return shape;
        }

        public updateCenter(): void {
            if (this.points.length > 0) {
                this.center.copyFromFloats(0, 0, 0);
                this.points.forEach(pt => {
                    this.center.addInPlace(pt);
                });
                this.center.scaleInPlace(1 / this.points.length);
            }
        }
    }
}