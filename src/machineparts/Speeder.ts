namespace MarbleRunSimulatorCore {
    export class Speeder extends MachinePart {
        
        public base: BABYLON.Mesh;
        public wheel0: BABYLON.Mesh;
        public wheel1: BABYLON.Mesh;
        public rubber0: BABYLON.Mesh;
        public rubber1: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(1);

            this.setTemplate(this.machine.templateManager.getTemplate(Speeder.PropToPartName(prop)));
            this.generateWires();

            this.base = new BABYLON.Mesh("base");
            this.base.material = this.game.materials.getMaterial(this.getColor(0), this.machine.materialQ);
            this.base.position.x = (- tileSize * 0.5 + tileSize * (prop.l - 0.5)) * 0.5;
            this.base.parent = this;

            this.wheel0 = new BABYLON.Mesh("wheel0");
            this.wheel0.parent = this;
            this.wheel0.position.x = (- tileSize * 0.5 + tileSize * (prop.l - 0.5)) * 0.5;
            this.wheel0.position.y = 0.006;
            this.wheel0.position.z = - 0.008 - 0.006;
            
            this.wheel1 = new BABYLON.Mesh("wheel1");
            this.wheel1.parent = this;
            this.wheel1.position.x = (- tileSize * 0.5 + tileSize * (prop.l - 0.5)) * 0.5;
            this.wheel1.position.y = 0.006;
            this.wheel1.position.z = 0.008 + 0.007;

            this.rubber0 = new BABYLON.Mesh("rubber0");
            this.rubber0.parent = this.wheel0;

            this.rubber1 = new BABYLON.Mesh("rubber1");
            this.rubber1.parent = this.wheel1;

            this.outlinableMeshes = [];
            this.outlinableMeshes.push(this.base);
            this.outlinableMeshes.push(this.rubber0);
            this.outlinableMeshes.push(this.rubber1);
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "speeder_" + prop.l.toFixed(0);
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

        public static GenerateTemplate(l: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "speeder_" + l;
            template.lExtendableOnX = true;
            template.l = l;
            template.h = 0;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileSize * 0.5, 0, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileSize * (template.l - 0.5), 0, 0), Tools.V3Dir(90))
            ];

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
                let dX = ball.position.x - this.base.absolutePosition.x;
                let dY = ball.position.y - (this.base.absolutePosition.y + 0.006);
                let dZ = ball.position.z - this.base.absolutePosition.z;
                if (Math.abs(dY) < 0.01) {
                    if ((dX * dX + dZ * dZ) < 0.02 * 0.02) {
                        let v = ball.velocity.length();
                        if (v < 0.01) {
                            ball.velocity.copyFrom(this.right);
                        }
                        else if (v < 1) {
                            ball.velocity.normalize().scaleInPlace(1);
                        }
                        this._rotationSpeed = 20 * Math.sign(ball.velocity.x);
                    }
                }
            }
        }
    }
}
