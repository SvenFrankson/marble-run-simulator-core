namespace MarbleRunSimulatorCore {
    export class Screen extends MachinePart {

        private _animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;

        public pixels: BABYLON.Mesh[] = [];
        public value: number = 0;
        public came: BABYLON.Mesh;
        public cameInCollider: BABYLON.Mesh;
        public cameOutCollider: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "screen";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));

            for (let i = this.colors.length; i < 2; i++) {
                this.colors[i] = 0;
            }

            this.pixels = [
                new BABYLON.Mesh("pixel-0"),
                new BABYLON.Mesh("pixel-1"),
                new BABYLON.Mesh("pixel-2"),
                new BABYLON.Mesh("pixel-3")
            ]
            this.pixels[0].parent = this;
            this.pixels[0].position.copyFromFloats(tileWidth * 0.5 - 0.02, 0, - tileDepth / 4);
            this.pixels[1].parent = this;
            this.pixels[1].position.copyFromFloats(tileWidth * 0.5 - 0.02, 0, tileDepth / 4);
            this.pixels[2].parent = this;
            this.pixels[2].position.copyFromFloats(tileWidth * 0.5 - 0.02, - tileHeight, tileDepth / 4);
            this.pixels[3].parent = this;
            this.pixels[3].position.copyFromFloats(tileWidth * 0.5 - 0.02, - tileHeight, - tileDepth / 4);

            this.came = new BABYLON.Mesh("came");
            this.came.parent = this;
            this.came.position.copyFromFloats(- tileWidth * 0.5 + 0.014, - tileHeight * 0.25, 0);
            this.cameInCollider = new BABYLON.Mesh("collider-came-in");
            this.cameInCollider.isVisible = false;
            this.cameInCollider.parent = this.came;
            this.cameOutCollider = new BABYLON.Mesh("collider-came-out");
            this.cameOutCollider.isVisible = false;
            this.cameOutCollider.parent = this.came;

            this.generateWires();

            this._animatePivot = Mummu.AnimationFactory.CreateNumber(
                this,
                this.came.rotation,
                "z",
                () => {
                    this.came.freezeWorldMatrix();
                    this.came.getChildMeshes().forEach((child) => {
                        child.freezeWorldMatrix();
                    });
                },
                false,
                Nabu.Easing.easeInSquare
            );
        }

        public rotatePixels(
            origin: number,
            target: number,
            duration: number,
            easing?: (v: number) => number
        ): Promise<void> {
            return new Promise<void>(resolve => {
                let rz0s: number[] = [0, 0, 0, 0];
                let rz1s: number[] = [0, 0, 0, 0];
                
                if (origin & 0b1) {
                    rz0s[0] = Math.PI;
                    rz1s[0] = 2 * Math.PI;
                }
                if (origin & 0b10) {
                    rz0s[1] = Math.PI;
                    rz1s[1] = 2 * Math.PI;
                }
                if (origin & 0b100) {
                    rz0s[2] = Math.PI;
                    rz1s[2] = 2 * Math.PI;
                }
                if (origin & 0b1000) {
                    rz0s[3] = Math.PI;
                    rz1s[3] = 2 * Math.PI;
                }
                
                if (target & 0b1) {
                    rz1s[0] = Math.PI;
                }
                if (target & 0b10) {
                    rz1s[1] = Math.PI;
                }
                if (target & 0b100) {
                    rz1s[2] = Math.PI;
                }
                if (target & 0b1000) {
                    rz1s[3] = Math.PI;
                }

                let t0 = performance.now();
                if (this["rotatePixels_animation"]) {
                    this.game.scene.onBeforeRenderObservable.removeCallback(this["rotatePixels_animation"]);
                }
                let animationCB = () => {
                    let f = (performance.now() - t0) / 1000 / duration;
                    if (f < 1) {
                        if (easing) {
                            f = easing(f);
                        }
                        for (let i = 0; i < 4; i++) {
                            this.pixels[i].rotation.z = rz0s[i] * (1 - f) + rz1s[i] * f;
                            this.pixels[i].freezeWorldMatrix();
                        }
                    }
                    else {
                        for (let i = 0; i < 4; i++) {
                            this.pixels[i].rotation.z = rz1s[i];
                            this.pixels[i].freezeWorldMatrix();
                        }
                        this.game.scene.onBeforeRenderObservable.removeCallback(animationCB);
                        this["rotatePixels_animation"] = undefined;
                        resolve();
                    }
                }
                this.game.scene.onBeforeRenderObservable.add(animationCB);
                this["rotatePixels_animation"] = animationCB;
            })
        }

        protected async instantiateMachineSpecific(): Promise<void> {

            let screenData = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/screen.babylon");
            screenData[0].applyToMesh(this.came);
            this.came.material = this.game.materials.getMaterial(0);
            screenData[1].applyToMesh(this.cameInCollider);
            screenData[2].applyToMesh(this.cameOutCollider);
            for (let i = 0; i < 4; i++) {
                screenData[3].applyToMesh(this.pixels[i]);
                this.pixels[i].material = this.game.materials.whiteAutolitMaterial;
            }
        }

        public static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "screen";
            template.h = 1;
            template.w = 1;

            template.mirrorX = mirrorX;
            template.xMirrorable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let dY = 0.014;
            let yIn = 0;
            let yOut = - tileHeight;

            let cY = (yIn + yOut + dY) * 0.5;
            let rIn = Math.abs(yIn - cY);
            let rOut = Math.abs(yOut - cY);

            let aMinOut = 0;
            let aMaxIn = Math.PI;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- tileWidth * 0.5, yIn, 0), Tools.V3Dir(90), Tools.V3Dir(0))];

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(
                    template.trackTemplates[1],
                    new BABYLON.Vector3(- tileWidth * 0.5 + dY + Math.sin(aMinOut) * rOut, cY + Math.cos(aMinOut) * rOut, 0),
                    Tools.V3Dir(aMinOut / Math.PI * 180 + 90),
                    Tools.V3Dir(aMinOut / Math.PI * 180 + 180))
            ];
            template.trackTemplates[1].drawStartTip = true;

            for (let a = 0; a <= 4; a++) {
                let f = a / 4;
                let angle = Math.PI * f;
                let cosa = Math.cos(angle);
                let sina = Math.sin(angle);

                let dir = Tools.V3Dir(angle / Math.PI * 180 + 90);
                let norm = Tools.V3Dir(angle / Math.PI * 180);

                if (angle < aMaxIn) {
                    let p = new BABYLON.Vector3(- tileWidth * 0.5 + dY, cY, 0);
                    p.x += sina * rIn;
                    p.y += cosa * rIn;
                    template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], p, dir, norm));
                }

                if (angle > aMinOut) {
                    let p = new BABYLON.Vector3(- tileWidth * 0.5 + dY, cY, 0);
                    p.x += sina * rOut;
                    p.y += cosa * rOut;
                    template.trackTemplates[1].trackpoints.push(new TrackPoint(template.trackTemplates[1], p, dir, norm ? norm.scale(-1) : undefined));
                }
            }

            template.trackTemplates[0].trackpoints.push(
                new TrackPoint(
                    template.trackTemplates[0],
                    new BABYLON.Vector3(- tileWidth * 0.5 + dY + Math.sin(aMaxIn) * rIn, cY + Math.cos(aMaxIn) * rIn, 0),
                    Tools.V3Dir(aMaxIn / Math.PI * 180 + 90),
                    Tools.V3Dir(aMaxIn / Math.PI * 180)
                )
            );

            template.trackTemplates[1].trackpoints.push(new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(- tileWidth * 0.5, yOut, 0), Tools.V3Dir(- 90), Tools.V3Dir(0)));

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
        
        private _moving: boolean = false;
        public get isMoving(): boolean {
            return this._moving;
        }
        public update(dt: number): void {
            let dY = 0.014;
            let yIn = 0;
            let yOut = - tileHeight;

            let cY = (yIn + yOut + dY) * 0.5;
            let center = new BABYLON.Vector3(- tileWidth * 0.5 + dY, cY, 0);
            center.addInPlace(this.position);

            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (Math.abs(ball.position.z - this.position.z) < 0.002) {
                        let relativePos = ball.position.subtract(this.position);
                        if (Math.abs(relativePos.x + 0.022) < 0.003) {
                            if (Math.abs(relativePos.y - 0.007) < 0.003) {
                                this._moving = true;
                                ball.marbleChocSound.setVolume(1);
                                ball.marbleChocSound.play();
                                this._animatePivot(- 2 * Math.PI, 0.5 / this.game.currentTimeFactor).then(() => {
                                    //this.clicSound.play();
                                    this.came.rotation.z = 0;
                                    setTimeout(() => {
                                        this._moving = false;
                                    }, 100 / this.game.currentTimeFactor);
                                });
                                this.rotatePixels(this.value, (this.value + 1) % 16, 0.5 / this.game.currentTimeFactor);
                                this.value = (this.value + 1) % 16;
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
}
