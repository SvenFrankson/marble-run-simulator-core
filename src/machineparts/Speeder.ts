namespace MarbleRunSimulatorCore {
    export class Speeder extends MachinePart {
        
        public base: BABYLON.Mesh;
        public wheel0: BABYLON.Mesh;
        public wheel1: BABYLON.Mesh;
        public rubber0: BABYLON.Mesh;
        public rubber1: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            this.setTemplate(this.machine.templateManager.getTemplate(Speeder.PropToPartName(prop)));
            this.generateWires();

            this.base = new BABYLON.Mesh("base");
            this.base.material = this.game.materials.getMaterial(this.getColor(0), this.machine.materialQ);
            this.base.parent = this;

            this.wheel0 = new BABYLON.Mesh("wheel0");
            this.wheel0.parent = this;
            this.wheel0.position.y = 0.006;
            this.wheel0.position.z = - 0.008 - 0.006;
            
            this.wheel1 = new BABYLON.Mesh("wheel1");
            this.wheel1.parent = this;
            this.wheel1.position.y = 0.006;
            this.wheel1.position.z = 0.008 + 0.007;

            this.rubber0 = new BABYLON.Mesh("rubber0");
            this.rubber0.parent = this.wheel0;

            this.rubber1 = new BABYLON.Mesh("rubber1");
            this.rubber1.parent = this.wheel1;
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "speeder";
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            let speederDatas = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/speeder.babylon");

            speederDatas[0].applyToMesh(this.rubber0);
            this.rubber0.material = this.game.materials.plasticBlack;
            speederDatas[0].applyToMesh(this.rubber1);
            this.rubber1.material = this.game.materials.plasticBlack;
            speederDatas[1].applyToMesh(this.wheel0);
            this.wheel0.material = this.game.materials.getMaterial(0, this.machine.materialQ);
            speederDatas[1].applyToMesh(this.wheel1);
            this.wheel1.material = this.game.materials.getMaterial(0, this.machine.materialQ);
            speederDatas[2].applyToMesh(this.base);
        }

        public static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "speeder";
            template.l = 1;
            template.h = 0;

            template.mirrorX = mirrorX;

            template.xMirrorable = true;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileSize * 0.5, 0, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileSize * 0.5, 0, 0), Tools.V3Dir(90))
            ];

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
        
        private _rotationSpeed: number = 0;
        public update(dt: number): void {
            super.update(dt);
            if (Math.abs(this._rotationSpeed) > 0.01 ) {
                let fps = 1 / dt;
                this._rotationSpeed = Nabu.Easing.smooth2Sec(fps) * this._rotationSpeed;
                this.wheel0.rotation.y += this._rotationSpeed * 2 * Math.PI * dt;
                this.wheel0.freezeWorldMatrix();
                this.wheel1.rotation.y -= this._rotationSpeed * 2 * Math.PI * dt;
                this.wheel1.freezeWorldMatrix();
            }

            for (let i = 0; i < this.machine.balls.length; i++) {
                let ball = this.machine.balls[i];
                let deltaPos = ball.position.subtract(this.position);
                if (Math.abs(deltaPos.x) < 0.04) {
                    if (Math.abs(deltaPos.y) < tileHeight * 0.5) {
                        if (Math.abs(deltaPos.z) < 0.001) {
                            if (ball.velocity.length() < 1) {
                                ball.velocity.normalize().scaleInPlace(1);
                            }
                            this._rotationSpeed = 20 * Math.sign(ball.velocity.x);
                        }
                    }
                }
            }
        }
    }
}
