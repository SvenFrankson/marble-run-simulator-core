namespace MarbleRunSimulatorCore {
    export class Controler extends MachinePart {
        private _animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;

        public pivotPass: BABYLON.Mesh;
        public pivotController: BABYLON.Mesh;
        public pivotControllerCollider: BABYLON.Mesh;
        public support: BABYLON.Mesh;
        public cog13: BABYLON.Mesh;
        public cog8: BABYLON.Mesh;

        public axisZMin: number = 0;
        public axisZMax: number = 1;
        
        public clicSound: BABYLON.Sound;

        public static pivotL: number = 0.014;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(6);

            this.setTemplate(this.machine.templateManager.getTemplate(Controler.PropToPartName(prop), prop.mirrorX));

            this.clicSound = new BABYLON.Sound("clic-sound", "./lib/marble-run-simulator-core/datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);

            let dz = this.wireGauge * 0.5;
            let depth = 2;

            this.pivotPass = new BABYLON.Mesh("pivotPass");
            this.pivotPass.position.copyFromFloats(0, -tileHeight * 0.5, 0);
            this.pivotPass.parent = this;

            this.axisZMin = - this.wireGauge * 0.6 - depth * tileSize;
            this.axisZMax = this.wireGauge * 0.6;

            this.cog13 = new BABYLON.Mesh("cog13");
            this.cog13.parent = this.pivotPass;

            this.pivotController = new BABYLON.Mesh("pivotController");
            this.pivotController.position.copyFromFloats(0, tileHeight * 0.5, 0);
            this.pivotController.parent = this;

            this.pivotControllerCollider = new BABYLON.Mesh("collider-trigger");
            this.pivotControllerCollider.isVisible = false;
            this.pivotControllerCollider.parent = this.pivotController;

            this.cog8 = new BABYLON.Mesh("cog8");
            this.cog8.parent = this.pivotController;

            this.support = new BABYLON.Mesh("support");
            this.support.position.copyFromFloats(0, -tileHeight * 0.5, - depth / 2 * tileSize);
            this.support.parent = this;

            let wireVertical0 = new Wire(this);
            wireVertical0.colorIndex = 5;
            wireVertical0.parent = this.pivotPass;
            wireVertical0.path = [new BABYLON.Vector3(0, Controler.pivotL, -dz - depth * tileSize), new BABYLON.Vector3(0, -Controler.pivotL, -dz - depth * tileSize)];

            let wireVertical1 = new Wire(this);
            wireVertical1.colorIndex = 5;
            wireVertical1.parent = this.pivotPass;
            wireVertical1.path = [new BABYLON.Vector3(0, Controler.pivotL, dz - depth * tileSize), new BABYLON.Vector3(0, -Controler.pivotL, dz - depth * tileSize)];

            this.wires = [wireVertical0, wireVertical1];

            this.generateWires();

            this._animatePivot = Mummu.AnimationFactory.CreateNumber(
                this,
                this.pivotPass.rotation,
                "z",
                () => {
                    if (!this.machine.playing) {
                        this.pivotPass.rotation.z = Math.PI / 4;
                    }
                    this.pivotPass.freezeWorldMatrix();
                    this.pivotPass.getChildMeshes().forEach((child) => {
                        child.freezeWorldMatrix();
                    });
                    this.pivotController.rotation.z = -this.pivotPass.rotation.z * 8 / 13;
                    this.pivotController.freezeWorldMatrix();
                    this.pivotController.getChildMeshes().forEach((child) => {
                        child.freezeWorldMatrix();
                    });
                    this.wires.forEach((wire) => {
                        wire.recomputeAbsolutePath();
                    });
                },
                false,
                Nabu.Easing.easeInSquare
            );
            
            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "controler";
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            let depth = 2;

            let q = Mummu.QuaternionFromYZAxis(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0));
            let axisPassVertexData = BABYLON.CreateCylinderVertexData({ height: tileSize * depth / 2 + this.wireGauge * 1.2, diameter: 0.001 });
            Mummu.RotateVertexDataInPlace(axisPassVertexData, q);
            Mummu.TranslateVertexDataInPlace(axisPassVertexData, new BABYLON.Vector3(0, 0, - 0.5 * tileSize * depth / 2));

            let axisControllerVertexData = BABYLON.CreateCylinderVertexData({ height: tileSize * depth / 2 + this.wireGauge * 1.2, diameter: 0.001 });
            Mummu.RotateVertexDataInPlace(axisControllerVertexData, q);
            Mummu.TranslateVertexDataInPlace(axisControllerVertexData, new BABYLON.Vector3(0, tileHeight, 0.5 * tileSize * depth / 2));

            let supportData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 2);
            supportData = Mummu.MergeVertexDatas(axisControllerVertexData, axisPassVertexData, supportData);
            supportData.applyToMesh(this.support);
            this.support.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);

            let cog8Data = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 0);
            cog8Data = Mummu.CloneVertexData(cog8Data);
            Mummu.TranslateVertexDataInPlace(cog8Data, new BABYLON.Vector3(0, 0, - depth / 2 * tileSize));
            cog8Data.applyToMesh(this.cog8);
            this.cog8.material = this.game.materials.getMaterial(this.getColor(5), this.machine.materialQ);

            let cog13Data = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 1);
            cog13Data = Mummu.CloneVertexData(cog13Data);
            Mummu.TranslateVertexDataInPlace(cog13Data, new BABYLON.Vector3(0, 0, - depth / 2 * tileSize));
            cog13Data.applyToMesh(this.cog13);
            this.cog13.material = this.game.materials.getMaterial(this.getColor(5), this.machine.materialQ);

            let arrowData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon", 0);
            arrowData = Mummu.CloneVertexData(arrowData);
            Mummu.TranslateVertexDataInPlace(arrowData, new BABYLON.Vector3(0, 0, this.axisZMin));
            arrowData.applyToMesh(this.pivotPass);
            this.pivotPass.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);

            let triggerData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/control-trigger.babylon", 0);
            triggerData.applyToMesh(this.pivotController);
            this.pivotController.material = this.game.materials.getMaterial(this.getColor(5), this.machine.materialQ);
            
            let triggerColliderData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/control-trigger.babylon", 1);
            triggerColliderData.applyToMesh(this.pivotControllerCollider);
        }

        public static GenerateTemplate(mirrorX: boolean) {
            let template = new MachinePartTemplate();

            template.partName = "controler";

            template.l = 1;
            template.h = 1;
            template.d = 2;
            template.mirror = mirrorX;

            template.mirrorable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let pEndLeft = new BABYLON.Vector3(0, -tileHeight * 0.5, 0);
            pEndLeft.x -= Controler.pivotL / Math.SQRT2;
            pEndLeft.y += Controler.pivotL / Math.SQRT2;
            let pEndRight = new BABYLON.Vector3(0, -tileHeight * 0.5, 0);
            pEndRight.x += Controler.pivotL / Math.SQRT2;
            pEndRight.y += Controler.pivotL / Math.SQRT2;
            let dirEnd = Tools.V3Dir(115);
            let dirEndMirror = dirEnd.multiplyByFloats(- 1, 1, 1);
            let depth = 2;

            // Control
            // Control In Left
            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), dir),
                new TrackPoint(template.trackTemplates[0], pEndLeft.subtract(dirEnd.scale(0.0005)), dirEnd)
            ];

            // Control In Right
            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(tileWidth * 0.5, 0, 0), dir.multiplyByFloats(-1, 1, 1)),
                new TrackPoint(template.trackTemplates[1], pEndRight.subtract(dirEnd.scale(0.0005).multiplyByFloats(-1, 1, 1)), dirEndMirror)
            ];

            // Control Out
            template.trackTemplates[2] = new TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 0;
            template.trackTemplates[2].trackpoints = [
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * template.h, 0), dir),
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(tileWidth * 0.5 - 0.015, -tileHeight * template.h + 0.001, 0), dir),
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(tileWidth * 0.5, -tileHeight * template.h + 0.001 + 0.015, 0), Tools.V3Dir(0), Tools.V3Dir(- 90))
            ];
            template.trackTemplates[2].drawEndTip = true;

            // Pass
            // Pass In
            template.trackTemplates[3] = new TrackTemplate(template);
            template.trackTemplates[3].colorIndex = 2;
            template.trackTemplates[3].trackpoints = [
                new TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(-tileWidth * 0.5, 0, - depth * tileSize), dir), 
                new TrackPoint(template.trackTemplates[3], pEndLeft.subtract(dirEnd.scale(0.0005)).subtractFromFloats(0, 0, depth * tileSize), dirEnd)
            ];

            // Pass out Left
            template.trackTemplates[4] = new TrackTemplate(template);
            template.trackTemplates[4].colorIndex = 2;
            template.trackTemplates[4].trackpoints = [
                new TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * template.h, - depth * tileSize), dir), 
                new TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(-Split.pivotL / Math.SQRT2, -tileHeight * 0.5 - Split.pivotL / Math.SQRT2 - 0.001, - depth * tileSize), dirEnd.multiplyByFloats(1, -1, 1))
            ];

            // Pass out Right
            template.trackTemplates[5] = new TrackTemplate(template);
            template.trackTemplates[5].colorIndex = 3;
            template.trackTemplates[5].trackpoints = [
                new TrackPoint(template.trackTemplates[5], new BABYLON.Vector3(Split.pivotL / Math.SQRT2, -tileHeight * 0.5 - Split.pivotL / Math.SQRT2 - 0.001, - depth * tileSize), dirEnd), 
                new TrackPoint(template.trackTemplates[5], new BABYLON.Vector3(tileWidth * 0.5, -tileHeight * template.h, - depth * tileSize), dir)
            ];

            // Shield
            template.trackTemplates[6] = new TrackTemplate(template);
            template.trackTemplates[6].colorIndex = 4;
            template.trackTemplates[6].trackpoints = [
                new TrackPoint(template.trackTemplates[6], new BABYLON.Vector3(-tileWidth * 0.25, 0.016, - depth * tileSize), Tools.V3Dir(100), new BABYLON.Vector3(0, -1, 0)),
                new TrackPoint(template.trackTemplates[6], new BABYLON.Vector3(0, 0.005, - depth * tileSize)),
                new TrackPoint(template.trackTemplates[6], new BABYLON.Vector3(tileWidth * 0.25, 0.016, - depth * tileSize), Tools.V3Dir(80), new BABYLON.Vector3(0, -1, 0)),
            ];
            template.trackTemplates[6].drawStartTip = true;
            template.trackTemplates[6].drawEndTip = true;
            template.trackTemplates[6].noMiniatureRender = true;

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            template.miniatureShapes.push(MiniatureShape.MakeNGon(
                new BABYLON.Vector3(0, tileHeight * 0.5, - tileSize - 0.003),
                tileHeight * 0.5,
                BABYLON.Axis.Z,
                16,
                true
            ));
            template.miniatureShapes.push(MiniatureShape.MakeNGon(
                new BABYLON.Vector3(0, tileHeight * 0.5, - tileSize + 0.003),
                tileHeight * 0.5,
                BABYLON.Axis.Z,
                16,
                true
            ));

            template.miniatureShapes.push(MiniatureShape.MakeNGon(
                new BABYLON.Vector3(0, - tileHeight * 0.5, - tileSize - 0.003),
                tileHeight * 0.5,
                BABYLON.Axis.Z,
                16,
                true
            ));
            template.miniatureShapes.push(MiniatureShape.MakeNGon(
                new BABYLON.Vector3(0, - tileHeight * 0.5, - tileSize + 0.003),
                tileHeight * 0.5,
                BABYLON.Axis.Z,
                16,
                true
            ));

            return template;
        }

        public dispose(): void {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }

        public reset = () => {
            this._moving = false;
            if (this.mirrorX) {
                this.pivotPass.rotation.z = -Math.PI / 4;
            } else {
                this.pivotPass.rotation.z = Math.PI / 4;
            }
            this.pivotController.rotation.z = -this.pivotPass.rotation.z * 8 / 13;
            this.pivotPass.freezeWorldMatrix();
            this.pivotPass.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
            this.pivotController.freezeWorldMatrix();
            this.pivotController.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
            this.wires.forEach((wire) => {
                wire.recomputeAbsolutePath();
            });
        };

        private _moving: boolean = false;
        public update(dt: number): void {
            super.update(dt);
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivotController.absolutePosition) < 0.05) {
                        let local = BABYLON.Vector3.TransformCoordinates(ball.position, this.pivotController.getWorldMatrix().clone().invert());
                        if (local.y < 0 && local.y > - 0.03) {
                            if (local.x > 0 && local.x < ball.radius + 0.004) {
                                this._moving = true;
                                ball.marbleChocSound.setVolume(1);
                                ball.marbleChocSound.play();
                                this._animatePivot(Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                    this.clicSound.play();
                                    setTimeout(() => {
                                        this._moving = false;
                                    }, 500 / this.game.currentTimeFactor);
                                });
                                return;
                            } else if (local.x < 0 && local.x > - ball.radius - 0.004) {
                                this._moving = true;
                                ball.marbleChocSound.setVolume(1);
                                ball.marbleChocSound.play();
                                this._animatePivot(-Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                    this.clicSound.play();
                                    setTimeout(() => {
                                        this._moving = false;
                                    }, 500 / this.game.currentTimeFactor);
                                });
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
}
