namespace MarbleRunSimulatorCore {

    export class BallBoostAnimation extends BABYLON.Mesh {

        private _duration: number = 1.3;
        private _timer: number = 0;
        public shown: boolean = false;

        public get instantiated(): boolean {
            return this.rings && this.rings.length > 0;
        }

        public rings: BABYLON.Mesh[] = [];

        constructor(public ball: Ball) {
            super("ball-boost-animation");
        }


        public instantiate(): void {
            if (!this.instantiated) {
                for (let i = 0; i < 4; i++) {
                    //this.rings[i] = BABYLON.MeshBuilder.CreateCylinder("ring-" + i.toFixed(0), { height: 0.0015, diameter: 0.02, tessellation: 12 });
                    this.rings[i] = BABYLON.MeshBuilder.CreateTorus("ring-" + i.toFixed(0), { diameter: 0.017, tessellation: 12, thickness: 0.002 });
                    this.rings[i].material = this.ball.game.materials.ballAnimationMaterial;
                    this.rings[i].visibility = 0;
                    this.rings[i].parent = this;
                }
            }
        }

        public uninstantiate(): void {
            for (let i = 0; i < this.rings.length; i++) {
                this.rings[i].dispose();
            }
            this.rings = [];
        }

        public update(rawDT: number): void {
            this._timer += rawDT;
            while (this._timer > this._duration) {
                this._timer -= this._duration;
            }

            let targetAlpha = this.shown ? 1 : 0;
            let f = Nabu.Easing.smoothNSec(1 / rawDT, 0.3);
            for (let i = 0; i < this.rings.length; i++) {
                this.rings[i].visibility = this.rings[i].visibility * f + targetAlpha * (1 - f);
            }

            this.position.copyFrom(this.ball.position);
            for (let i = 0; i < this.rings.length; i++) {
                let f = this._timer / this._duration + i / this.rings.length;
                while (f > 1) {
                    f -= 1;
                }

                this.rings[i].position.y = - this.ball.radius - 0.02 + 0.02 * f;
                let size = 1;
                if (f <= 0.9) {
                    size = f / 0.9;
                }
                else {
                    size = 1 - (f - 0.9) / 0.1;
                }
                this.rings[i].scaling.copyFromFloats(size, size, size);
            }
        }
    }
}