namespace MarbleRunSimulatorCore {
    export class Spawner extends MachinePart {
        private _animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;

        public pivotPass: BABYLON.Mesh;
        public pivotSpawner: BABYLON.Mesh;
        public pivotSpawnerCollider: BABYLON.Mesh;
        public support: BABYLON.Mesh;
        public cog13: BABYLON.Mesh;
        public cog8: BABYLON.Mesh;

        public axisZMin: number = 0;
        public axisZMax: number = 1;
        
        public clicSound: BABYLON.Sound;
        private angleOpened: number;
        private angleClosed: number;

        public static pivotL: number = 0.013;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "spawner";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));

            this.clicSound = new BABYLON.Sound("clic-sound", "./lib/marble-run-simulator-core/datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);

            for (let i = this.colors.length; i < 6; i++) {
                this.colors[i] = 0;
            }

            this.axisZMin = - this.wireGauge * 0.6 - tileDepth;
            this.axisZMax = this.wireGauge * 0.6;

            if (this.mirrorX) {
                this.angleClosed = -Math.PI / 4;
            }
            else {
                this.angleClosed = Math.PI / 4;
            }
            this.angleOpened = - this.angleClosed;

            this.pivotPass = new BABYLON.Mesh("pivotPass");
            this.pivotPass.position.copyFromFloats(0, -tileHeight * 0.5, 0);
            this.pivotPass.parent = this;
            let dz = this.wireGauge * 0.5;

            this.cog13 = new BABYLON.Mesh("cog13");
            this.cog13.parent = this.pivotPass;

            this.pivotSpawner = new BABYLON.Mesh("pivotSpawner");
            this.pivotSpawner.position.copyFromFloats(0, tileHeight * 0.5, 0);
            this.pivotSpawner.parent = this;

            this.pivotSpawnerCollider = new BABYLON.Mesh("collider-trigger");
            this.pivotSpawnerCollider.isVisible = false;
            this.pivotSpawnerCollider.parent = this.pivotSpawner;

            this.cog8 = new BABYLON.Mesh("cog8");
            this.cog8.parent = this.pivotSpawner;

            this.support = new BABYLON.Mesh("support");
            this.support.position.copyFromFloats(0, -tileHeight * 0.5, - tileDepth * 0.5);
            this.support.parent = this;

            let wireHorizontal0 = new Wire(this);
            wireHorizontal0.colorIndex = 4;
            wireHorizontal0.parent = this.pivotPass;
            wireHorizontal0.path = [new BABYLON.Vector3(-Spawner.pivotL, 0, - dz - tileDepth), new BABYLON.Vector3(Spawner.pivotL, 0, - dz - tileDepth)];

            let wireHorizontal1 = new Wire(this);
            wireHorizontal1.colorIndex = 4;
            wireHorizontal1.parent = this.pivotPass;
            wireHorizontal1.path = [new BABYLON.Vector3(-Spawner.pivotL, 0, dz - tileDepth), new BABYLON.Vector3(Spawner.pivotL, 0, dz - tileDepth)];

            let wireVertical0 = new Wire(this);
            wireVertical0.colorIndex = 4;
            wireVertical0.parent = this.pivotPass;
            wireVertical0.path = [new BABYLON.Vector3(0, Spawner.pivotL, - dz - tileDepth), new BABYLON.Vector3(0, - Spawner.pivotL, - dz - tileDepth)];

            let wireVertical1 = new Wire(this);
            wireVertical1.colorIndex = 4;
            wireVertical1.parent = this.pivotPass;
            wireVertical1.path = [new BABYLON.Vector3(0, Spawner.pivotL, dz - tileDepth), new BABYLON.Vector3(0, - Spawner.pivotL, dz - tileDepth)];

            let arc0 = new Wire(this);
            arc0.wireSize = 0.001;
            arc0.colorIndex = 4;
            arc0.parent = this.pivotPass;
            arc0.path = [];
            
            let arc1 = new Wire(this);
            arc1.wireSize = 0.001;
            arc1.colorIndex = 4;
            arc1.parent = this.pivotPass;
            arc1.path = [];

            for (let i = 0; i <= 24; i++) {
                let a = i / 32 * 2 * Math.PI;
                if (this.mirrorX) {
                    a = - a;
                }
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                let r = Spawner.pivotL - 0.0005;
                let p0 = new BABYLON.Vector3(- sina * r, cosa * r, - dz - tileDepth);
                arc0.path.push(p0);
                let p1 = new BABYLON.Vector3(- sina * r, cosa * r, dz - tileDepth);
                arc1.path.push(p1);
            }

            this.wires = [wireHorizontal0, wireHorizontal1, wireVertical0, wireVertical1, arc0, arc1];

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
                    this.pivotSpawner.rotation.z = -this.pivotPass.rotation.z * 8 / 13;
                    this.pivotSpawner.freezeWorldMatrix();
                    this.pivotSpawner.getChildMeshes().forEach((child) => {
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

        protected async instantiateMachineSpecific(): Promise<void> {
            let q = Mummu.QuaternionFromYZAxis(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0));
            let axisPassVertexData = BABYLON.CreateCylinderVertexData({ height: tileDepth * 0.5 + this.wireGauge * 1.2, diameter: 0.001 });
            Mummu.RotateVertexDataInPlace(axisPassVertexData, q);
            Mummu.TranslateVertexDataInPlace(axisPassVertexData, new BABYLON.Vector3(0, 0, - 0.25 * tileDepth));

            let axisSpawnerVertexData = BABYLON.CreateCylinderVertexData({ height: tileDepth * 0.5 + this.wireGauge * 1.2, diameter: 0.001 });
            Mummu.RotateVertexDataInPlace(axisSpawnerVertexData, q);
            Mummu.TranslateVertexDataInPlace(axisSpawnerVertexData, new BABYLON.Vector3(0, tileHeight, 0.25 * tileDepth));

            let supportData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 2);
            supportData = Mummu.MergeVertexDatas(axisSpawnerVertexData, axisPassVertexData, supportData);
            supportData.applyToMesh(this.support);
            this.support.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);

            let cog8Data = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 0);
            cog8Data = Mummu.CloneVertexData(cog8Data);
            Mummu.TranslateVertexDataInPlace(cog8Data, new BABYLON.Vector3(0, 0, - tileDepth * 0.5));
            cog8Data.applyToMesh(this.cog8);
            this.cog8.material = this.game.materials.getMaterial(this.getColor(5), this.machine.materialQ);

            let cog13Data = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 1);
            cog13Data = Mummu.CloneVertexData(cog13Data);
            Mummu.TranslateVertexDataInPlace(cog13Data, new BABYLON.Vector3(0, 0, - tileDepth * 0.5));
            cog13Data.applyToMesh(this.cog13);
            this.cog13.material = this.game.materials.getMaterial(this.getColor(5), this.machine.materialQ);

            let arrowData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon", 0);
            arrowData = Mummu.CloneVertexData(arrowData);
            Mummu.TranslateVertexDataInPlace(arrowData, new BABYLON.Vector3(0, 0, this.axisZMin));
            arrowData.applyToMesh(this.pivotPass);
            this.pivotPass.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);

            let triggerData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/control-trigger.babylon", 0);
            triggerData.applyToMesh(this.pivotSpawner);
            this.pivotSpawner.material = this.game.materials.getMaterial(this.getColor(5), this.machine.materialQ);
            
            let triggerColliderData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/control-trigger.babylon", 1);
            triggerColliderData.applyToMesh(this.pivotSpawnerCollider);
        }

        public static GenerateTemplate(mirrorX: boolean) {
            let template = new MachinePartTemplate();

            template.partName = "spawner";

            template.w = 1;
            template.h = 1;
            template.d = 2;
            template.mirrorX = mirrorX;

            template.xMirrorable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let pEndLeft = new BABYLON.Vector3(0, -tileHeight * 0.5, 0);
            pEndLeft.x -= Spawner.pivotL / Math.SQRT2;
            pEndLeft.y += Spawner.pivotL / Math.SQRT2;
            let pEndRight = new BABYLON.Vector3(0, -tileHeight * 0.5, 0);
            pEndRight.x += Spawner.pivotL / Math.SQRT2;
            pEndRight.y += Spawner.pivotL / Math.SQRT2;
            let dirEnd = Tools.V3Dir(125);

            // Control
            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), dir),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.5, - tileHeight * template.h, 0), dir, Tools.V3Dir(0), 2)
            ];

            // Pass
            // Pass In
            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 2;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-tileWidth * 0.5, 0, - tileDepth), dir), 
                new TrackPoint(template.trackTemplates[1], pEndLeft.subtract(dirEnd.scale(0.001)).subtractFromFloats(0, 0, tileDepth), dirEnd)
            ];

            // Pass out Right
            template.trackTemplates[2] = new TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 3;
            template.trackTemplates[2].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(Sort.pivotL / Math.SQRT2, -tileHeight * 0.5 - Sort.pivotL / Math.SQRT2 - 0.001, - tileDepth), dirEnd), 
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(tileWidth * 0.5, -tileHeight * template.h, - tileDepth), dir)
            ];

            // Shield
            template.trackTemplates[3] = new TrackTemplate(template);
            template.trackTemplates[3].colorIndex = 4;
            template.trackTemplates[3].trackpoints = [
                new TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(-tileWidth * 0.25, 0.016, -tileDepth), Tools.V3Dir(100), new BABYLON.Vector3(0, -1, 0)),
                new TrackPoint(template.trackTemplates[3], pEndRight.add(Tools.V3Dir(45, 0.003)).subtractFromFloats(0, 0, tileDepth), Tools.V3Dir(135), Tools.V3Dir(225)),
            ];
            template.trackTemplates[3].drawStartTip = true;
            template.trackTemplates[3].drawEndTip = true;

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }

        public dispose(): void {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }

        public reset = () => {
            this._moving = false;
            this.pivotPass.rotation.z = this.angleClosed;
            this.pivotSpawner.rotation.z = -this.pivotPass.rotation.z * 8 / 13;
            this.pivotPass.freezeWorldMatrix();
            this.pivotPass.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
            this.pivotSpawner.freezeWorldMatrix();
            this.pivotSpawner.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
            this.wires.forEach((wire) => {
                wire.recomputeAbsolutePath();
            });
        };

        private _moving: boolean = false;
        public update(dt: number): void {
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivotSpawner.absolutePosition) < 0.05) {
                        let local = BABYLON.Vector3.TransformCoordinates(ball.position, this.pivotSpawner.getWorldMatrix().clone().invert());
                        if (local.y < 0 && local.y > - 0.03) {
                            if (
                                local.x < 0 && local.x > - ball.radius - 0.004 ||
                                local.x > 0 && local.x < ball.radius + 0.004
                            ) {
                                this._moving = true;
                                ball.marbleChocSound.setVolume(1);
                                ball.marbleChocSound.play();
                                this._animatePivot(this.angleOpened, 0.3 / this.game.currentTimeFactor).then(() => {
                                    this.clicSound.play();
                                    this._animatePivot(this.angleClosed, 0.3 / this.game.currentTimeFactor).then(() => {
                                        this.clicSound.play();
                                        setTimeout(() => {
                                            this._moving = false;
                                        }, 500 / this.game.currentTimeFactor);
                                    });
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
