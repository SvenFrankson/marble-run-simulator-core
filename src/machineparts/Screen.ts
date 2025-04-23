namespace MarbleRunSimulatorCore {
    export class Screen extends MachinePart {

        private _animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;
        private _animateLock0 = Mummu.AnimationFactory.EmptyNumberCallback;
        private _animateLock2 = Mummu.AnimationFactory.EmptyNumberCallback;
        private _animateTingle2Out = Mummu.AnimationFactory.EmptyNumberCallback;

        public container: BABYLON.Mesh;
        public pixels: BABYLON.Mesh[] = [];
        public pixelPictures: BABYLON.Mesh[] = [];
        public lock0: BABYLON.Mesh;
        public lock2: BABYLON.Mesh;
        public value: number = 0;
        public came: BABYLON.Mesh;
        public cameInCollider: BABYLON.Mesh;
        public cameOutCollider: BABYLON.Mesh;
        public cable: BABYLON.Mesh;
        public turnLoopSound: BABYLON.Sound;
        public anteV11Case: boolean = false;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            if (machine.version < 11) {
                this.anteV11Case = true;
            }

            this.setTemplate(this.machine.templateManager.getTemplate(Screen.PropToPartName(prop)));

            for (let i = this.colors.length; i < 2; i++) {
                this.colors[i] = 0;
            }

            this.container = new BABYLON.Mesh("screen-container");
            this.container.parent = this;
    
            this.pixels = [
                new BABYLON.Mesh("pixel-0"),
                new BABYLON.Mesh("pixel-1"),
                new BABYLON.Mesh("pixel-2"),
                new BABYLON.Mesh("pixel-3")
            ]
            this.lock0 = new BABYLON.Mesh("lock-0");
            this.lock0.position.copyFromFloats(0.0015, -0.009 * 1.25, 0.0115 * 1.25);
            this.lock0.parent = this.pixels[0];
            this.lock2 = new BABYLON.Mesh("lock-1");
            this.lock2.position.copyFromFloats(0.0015, -0.009 * 1.25, - 0.0115 * 1.25);
            this.lock2.parent = this.pixels[2];
            this.pixels[0].parent = this.container;
            this.pixels[0].position.copyFromFloats(tileWidth * 0.5 - 0.02, 0, - tileDepth / 4);
            this.pixels[1].parent = this.container;
            this.pixels[1].position.copyFromFloats(tileWidth * 0.5 - 0.02, 0, tileDepth / 4);
            this.pixels[2].parent = this.container;
            this.pixels[2].position.copyFromFloats(tileWidth * 0.5 - 0.02, - tileHeight * 1.5, tileDepth / 4);
            this.pixels[3].parent = this.container;
            this.pixels[3].position.copyFromFloats(tileWidth * 0.5 - 0.02, - tileHeight * 1.5, - tileDepth / 4);

            if (this.anteV11Case) {
                this.pixels[0].scaling.y = 1 / 1.5;
                this.pixels[1].scaling.y = 1 / 1.5;
                this.pixels[2].scaling.y = 1 / 1.5;
                this.pixels[2].position.y += tileHeight * 0.5;
                this.pixels[3].scaling.y = 1 / 1.5;
                this.pixels[3].position.y += tileHeight * 0.5;
            }

            for (let i = 0; i < 4; i++) {
                this.pixelPictures[i] = BABYLON.MeshBuilder.CreatePlane("pixel-pic", { width: 0.025, height: 0.026 });
                this.pixelPictures[i].rotation.y = Math.PI;
                this.pixelPictures[i].parent = this.pixels[i];
            }
            this.pixelPictures[0].position.z = 0.0005;
            this.pixelPictures[1].position.z = - 0.0005;
            this.pixelPictures[2].position.z = - 0.0005;
            this.pixelPictures[3].position.z = 0.0005;

            this.came = new BABYLON.Mesh("came");
            this.came.parent = this.container;
            this.came.position.copyFromFloats(- tileWidth * 0.5 + 0.014, - tileHeight * 0.25, 0);
            this.cameInCollider = new BABYLON.Mesh("collider-came-in");
            this.cameInCollider.isVisible = false;
            this.cameInCollider.parent = this.came;
            this.cameOutCollider = new BABYLON.Mesh("collider-came-out");
            this.cameOutCollider.isVisible = false;
            this.cameOutCollider.parent = this.came;

            this.cable = new BABYLON.Mesh("cable");
            this.cable.parent = this.container;
            this.cable.position.copyFrom(this.came.position);

            this.generateWires();

            this.turnLoopSound = new BABYLON.Sound("screen-turn-sound", "./lib/marble-run-simulator-core/datas/sounds/screen-came.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.turnLoopSound.setVolume(0.2);

            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();

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
                Nabu.Easing.easePendulum
            );

            this._animateLock0 = Mummu.AnimationFactory.CreateNumber(
                this.lock0,
                this.lock0.rotation,
                "x",
                () => {
                    this.lock0.freezeWorldMatrix();
                },
                false,
                Nabu.Easing.easeInCubic
            );

            this._animateLock2 = Mummu.AnimationFactory.CreateNumber(
                this.lock2,
                this.lock2.rotation,
                "x",
                () => {
                    this.lock2.freezeWorldMatrix();
                },
                false,
                Nabu.Easing.easeInCubic
            );

            this._animateTingle2Out = Mummu.AnimationFactory.CreateNumber(
                this.pixels[2],
                this.pixels[2].rotation,
                "z",
                () => {
                    this.pixels[2].freezeWorldMatrix();
                    this.pixelPictures[2].freezeWorldMatrix();
                    this.lock2.freezeWorldMatrix();
                },
                false,
                Nabu.Easing.easeOutSine
            );
        }
        

        public static PropToPartName(prop: IMachinePartProp): string {
            return "screen";
        }

        public engraine12Up = false;
        public engraine12Down = false;
        public async tingle2(pixel2Value: boolean, duration: number): Promise<void> {
            let originZ = this.pixels[2].rotation.z;
            await this._animateTingle2Out(originZ + Math.PI / 4, duration * 0.18);
            if (pixel2Value) {
                this.engraine12Up = true;
                this.engraine12Down = false;
            }
            else {
                this.engraine12Up = false;
                this.engraine12Down = true;
            }
        }

        public rotatePixels(
            origin: number,
            target: number,
            duration: number,
            easing?: (v: number) => number
        ): Promise<void> {
            return new Promise<void>(resolve => {
                let lock0Target: number = 0;
                let lock2Target: number = 0;
                let rz0s: number[] = [2 * Math.PI, 2 * Math.PI, 0, 0];
                let rz1s: number[] = [2 * Math.PI, 2 * Math.PI, 0, 0];
                
                if (origin & 0b1) {
                    rz0s[0] = Math.PI;
                    rz1s[0] = 0;
                }
                if (origin & 0b10) {
                    rz0s[1] = Math.PI;
                    rz1s[1] = 0;
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
                    lock0Target = - Math.PI * 0.5;
                }
                if (target & 0b10) {
                    rz1s[1] = Math.PI;
                }
                if (target & 0b100) {
                    rz1s[2] = Math.PI;
                    lock2Target = Math.PI * 0.5;
                }
                if (target & 0b1000) {
                    rz1s[3] = Math.PI;
                }

                let tingle2Case: boolean = ((origin & 0b100) === (target & 0b100)) && ((origin & 0b10) === 0 && (target & 0b10) > 0);

                if (tingle2Case) {
                    setTimeout(() => {
                        this.tingle2((target & 0b100) === 0, duration);
                    }, duration * 1000 * 0.32);
                }

                setTimeout(() => {
                    this._animateLock0(lock0Target, duration * 0.1);
                    this._animateLock2(lock2Target, duration * 0.1);
                }, duration * 1000 * 0.7);

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
                            if (i === 2 && tingle2Case) {
                                if (this.engraine12Up) {
                                    this.pixels[2].rotation.z = this.pixels[2].rotation.z * 0.5 - (this.pixels[1].rotation.z - Math.PI) * 0.5;
                                    this.pixels[2].freezeWorldMatrix();
                                    this.pixelPictures[2].freezeWorldMatrix();
                                }
                                if (this.engraine12Down) {
                                    this.pixels[2].rotation.z = this.pixels[2].rotation.z * 0.5 - (this.pixels[1].rotation.z - 2 * Math.PI) * 0.5;
                                    this.pixels[2].freezeWorldMatrix();
                                    this.pixelPictures[2].freezeWorldMatrix();
                                }
                            }
                            else {
                                this.pixels[i].rotation.z = rz0s[i] * (1 - f) + rz1s[i] * f;
                                this.pixels[i].freezeWorldMatrix();
                                this.pixelPictures[i].freezeWorldMatrix();
                            }
                        }
                        this.lock0.freezeWorldMatrix();
                        this.lock2.freezeWorldMatrix();
                    }
                    else {
                        this.engraine12Up = false;
                        this.engraine12Down = false;
                        for (let i = 0; i < 4; i++) {
                            this.pixels[i].rotation.z = rz1s[i];
                            this.pixels[i].freezeWorldMatrix();
                            this.pixelPictures[i].freezeWorldMatrix();
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
            this.came.material = this.game.materials.getMaterial(0, this.machine.materialQ);
            screenData[1].applyToMesh(this.cameInCollider);
            screenData[2].applyToMesh(this.cameOutCollider);
            for (let i = 0; i < 4; i++) {
                if (i === 0 && this.anteV11Case) {
                    screenData[10].applyToMesh(this.pixels[i]);
                }
                else {
                    screenData[3 + i].applyToMesh(this.pixels[i]);
                }
                this.pixels[i].material = this.game.materials.getMaterial(2, this.machine.materialQ);
                screenData[9].applyToMesh(this.pixelPictures[i]);
                this.pixelPictures[i].material = this.game.materials.getMaterial(0, this.machine.materialQ);
            }
            screenData[7].applyToMesh(this.lock0);
            this.lock0.material = this.game.materials.getMaterial(2, this.machine.materialQ);
            screenData[7].applyToMesh(this.lock2);
            this.lock2.material = this.game.materials.getMaterial(2, this.machine.materialQ);
            screenData[8].applyToMesh(this.cable);
            this.cable.material = this.game.materials.plasticBlack;
        }

        public static GenerateTemplate(): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "screen";
            template.h = 1;
            template.l = 1;

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
            template.trackTemplates[0].cutOutSleeper = () => { return true; };
            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- tileWidth * 0.5, yIn, 0), Tools.V3Dir(90), Tools.V3Dir(0))];
            template.trackTemplates[0].noMiniatureRender = true;

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

            template.initialize();

            let shape = new MiniatureShape();
            shape.points = [
                new BABYLON.Vector3(tileSize * 0.5, tileSize * 0.6, - tileSize * 1.1),
                new BABYLON.Vector3(tileSize * 0.5, - tileSize * 1.6, - tileSize * 1.1),
                new BABYLON.Vector3(tileSize * 0.5, - tileSize * 1.6, tileSize * 1.1),
                new BABYLON.Vector3(tileSize * 0.5, tileSize * 0.6, tileSize * 1.1)
            ];
            template.miniatureShapes = [shape];

            return template;
        }

        public reset = () => {
            this.value = 0;
            let rz1s: number[] = [2 * Math.PI, 2 * Math.PI, 0, 0];
            let lock0Target: number = 0;
            let lock2Target: number = 0;
            if (this.value & 0b1) {
                rz1s[0] = Math.PI;
                lock0Target = - Math.PI * 0.5;
            }
            if (this.value & 0b10) {
                rz1s[1] = Math.PI;
            }
            if (this.value & 0b100) {
                rz1s[2] = Math.PI;
                lock2Target = Math.PI * 0.5;
            }
            if (this.value & 0b1000) {
                rz1s[3] = Math.PI;
            }

            for (let i = 0; i < 4; i++) {
                this.pixels[i].rotation.z = rz1s[i];
                this.pixels[i].freezeWorldMatrix();
                this.pixelPictures[i].freezeWorldMatrix();
            }
            this.lock0.rotation.x = lock0Target;
            this.lock0.freezeWorldMatrix();
            this.lock2.rotation.x = lock2Target;
            this.lock2.freezeWorldMatrix();
        }
        
        public isInside(ball: Ball): boolean {
            let dY = 0.014;
            let yIn = 0;
            let yOut = - tileHeight;

            let cY = (yIn + yOut + dY) * 0.5;
            let center = new BABYLON.Vector3(- tileWidth * 0.5 + dY, cY, 0);
            BABYLON.Vector3.TransformCoordinatesToRef(center, this.getWorldMatrix(), center);

            let delta = ball.position.subtract(this.absolutePosition);
            if (Math.abs(BABYLON.Vector3.Dot(delta, this.forward)) < 0.03) {
                if (Math.abs(BABYLON.Vector3.Dot(delta, this.up)) < 0.03) {
                    let deltaX = BABYLON.Vector3.Dot(delta, this.right);
                    return deltaX < 0 && deltaX > - 0.05;
                }
            }
        }

        private _moving: boolean = false;
        public get isMoving(): boolean {
            return this._moving;
        }
        private _lastCamRotZ: number = 0;
        private _visibleAngularSpeed: number = 0;
        public update(dt: number): void {
            super.update(dt);
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    let delta = ball.position.subtract(this.absolutePosition);
                    if (Math.abs(BABYLON.Vector3.Dot(delta, this.forward)) < 0.002) {
                        if (Math.abs(BABYLON.Vector3.Dot(delta, this.right) + 0.022) < 0.003) {
                            if (Math.abs(BABYLON.Vector3.Dot(delta, this.up) - 0.007) < 0.003) {
                                this._moving = true;
                                ball.marbleChocSound.setVolume(1);
                                ball.marbleChocSound.play();
                                this.turnLoopSound.setPlaybackRate(this.game.currentTimeFactor);
                                this.turnLoopSound.play();
                                this._animatePivot(- 2 * Math.PI, 2 / this.game.currentTimeFactor).then(() => {
                                    //this.clicSound.play();
                                    this.came.rotation.z = 0;
                                    setTimeout(() => {
                                        this._moving = false;
                                    }, 100 / this.game.currentTimeFactor);
                                });
                                this.rotatePixels(this.value, (this.value + 1) % 16, 2 / this.game.currentTimeFactor, Nabu.Easing.easePendulum);
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
