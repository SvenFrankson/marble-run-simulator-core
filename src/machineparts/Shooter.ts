namespace MarbleRunSimulatorCore {
    export class Shooter extends MachinePart {
        
        public static velocityKicks: number[] = [
            1,
            1,
            1,
            3,
            1.03,
            1.27,
            1.46,
            1.64,
            1.80,
            1.94,
            2.08,
            2.21,
            2.33,
            2.44,
            2.55,
            2.66,
            2.76,
            2.86,
            2.955,
            3.045,
            3.135,
            3.225,
            3.305,
        ];
        public velocityKick: number = 1;

        public kicker: BABYLON.Mesh;
        public kickerCollider: BABYLON.Mesh;
        public kickerBody: BABYLON.Mesh;
        public kickerWeight: BABYLON.Mesh;
        public kickerRadius: number = 0.0025;
        public kickerLength: number = 0.04;
        public kickerYIdle: number = 0;
        public hasCollidingKicker: boolean = true;

        public shield: BABYLON.Mesh;
        public shieldCollider: BABYLON.Mesh;
        public shieldYClosed: number = 0;
        public shieldLength: number = 0.02;
        public clicSound: BABYLON.Sound;
        
        public base: BABYLON.Mesh;

        public animateKickerArm = Mummu.AnimationFactory.EmptyNumberCallback;
        public animateKickerKick = Mummu.AnimationFactory.EmptyNumberCallback;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            prop.h = Nabu.MinMax(prop.h, 3, 22);
            if (isNaN(prop.n)) {
                prop.n = 0;
            }

            let partName = "shooter_" + prop.h.toFixed(0) + "." + prop.n.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName));

            for (let i = this.colors.length; i < 5; i++) {
                this.colors[i] = 0;
            }

            let x = 1;

            this.generateWires();

            this.clicSound = new BABYLON.Sound("clic-sound", "./lib/marble-run-simulator-core/datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);

            this.velocityKick = Shooter.velocityKicks[this.h];

            this.base = new BABYLON.Mesh("base");

            this.kicker = new BABYLON.Mesh("kicker");
            this.kickerCollider = new BABYLON.Mesh("collider-kicker");
            this.kickerCollider.parent = this.kicker;
            this.kickerCollider.isVisible = false;
            
            this.kickerBody = new BABYLON.Mesh("kicker-body");
            this.kickerBody.parent = this.kicker;

            this.kickerWeight = new BABYLON.Mesh("kicker-weight");
            this.kickerWeight.parent = this.kicker;

            let cupR = 0.006;
            let dH = 0.001;
            this.kickerYIdle = tileHeight * 3 - dH - cupR * 0.8 - 0.004 + 0;
            this.kicker.parent = this;
            this.kicker.position.copyFromFloats(x * tileWidth * 0.4 - 0, this.kickerYIdle, 0);

            this.shield = new BABYLON.Mesh("shield");
            this.shieldCollider = new BABYLON.Mesh("collider-shield");
            this.shieldCollider.parent = this.shield;
            this.shieldCollider.isVisible = false;

            this.shieldYClosed = tileHeight * 3;
            this.shield.position.copyFromFloats(x * tileWidth * 0.4 - 0, this.shieldYClosed, 0);
            this.shield.parent = this;
            
            this.base.position.copyFromFloats(x * tileWidth * 0.4 - 0, this.shieldYClosed - 0.02, 0);
            this.base.parent = this;

            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();

            this.animateKickerArm = Mummu.AnimationFactory.CreateNumber(
                this,
                this.kicker.position,
                "y",
                () => {
                    this._freezeKicker();
                },
                false,
                Nabu.Easing.easeOutCubic
            );

            this.animateKickerKick = Mummu.AnimationFactory.CreateNumber(
                this,
                this.kicker.position,
                "y",
                () => {
                    this._freezeKicker();
                },
                false,
                Nabu.Easing.easeOutElastic
            );
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            let kickerDatas = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/kicker.babylon");

            if (kickerDatas[0]) {
                kickerDatas[0].applyToMesh(this.kicker);
                this.kicker.material = this.game.materials.plasticBlack;
            }
            
            if (kickerDatas[1]) {
                kickerDatas[1].applyToMesh(this.kickerBody);
            }
            this.kickerBody.material = this.game.materials.getMaterial(this.getColor(2), this.machine.materialQ);

            if (kickerDatas[2]) {
                kickerDatas[2].applyToMesh(this.kickerWeight);
            }
            this.kickerWeight.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);

            if (kickerDatas[4]) {
                kickerDatas[4].applyToMesh(this.base);
            }
            this.base.material = this.game.materials.getMaterial(this.getColor(3), this.machine.materialQ);

            if (kickerDatas[3]) {
                kickerDatas[3].applyToMesh(this.kickerCollider);
                this.kickerCollider.isVisible = false;
            }
            
            let shieldDatas = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/shield.babylon");

            if (shieldDatas[0]) {
                shieldDatas[0].applyToMesh(this.shield);
            }
            this.shield.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
            
            if (shieldDatas[1]) {
                shieldDatas[1].applyToMesh(this.shieldCollider);
                this.shieldCollider.isVisible = false;
            }
        }

        public static GenerateTemplate(h: number, n: number) {
            let template = new MachinePartTemplate();

            template.partName = "shooter_" + h.toFixed(0) + "." + n.toFixed(0);
            template.l = 1;
            template.h = h;
            template.n = n;

            template.hExtendableOnY = true;
            template.minH = 4;
            template.nExtendable = true;
            template.minN = 0;
            template.maxN = 10;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let norm = new BABYLON.Vector3(0, 1, 0);
            norm.normalize();

            let dirLeft = new BABYLON.Vector3(1, 0, 0);
            dirLeft.normalize();
            let nLeft = new BABYLON.Vector3(0, 1, 0);
            nLeft.normalize();

            let dirRight = new BABYLON.Vector3(1, 1, 0);
            dirRight.normalize();
            let nRight = new BABYLON.Vector3(-1, 1, 0);
            nRight.normalize();

            let cupR = 0.006;
            let dH = 0.001;

            if (h > 3) {
                template.trackTemplates[0] = new TrackTemplate(template);
                template.trackTemplates[0].colorIndex = 0;
                template.trackTemplates[0].trackpoints = [
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, tileHeight * 3, 0), dir),
    
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 - 1.6 * cupR, tileHeight * 3 - dH + 0, 0), dir),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 - 0, tileHeight * 3 - dH - cupR * 0.8 + 0, 0), dir),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR, tileHeight * 3 - dH + 0, 0), norm),
    
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR, tileHeight * h + 0, 0), norm),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR - 0.015, 0.035 + tileHeight * h + 0, 0), new BABYLON.Vector3(-1, 1, 0).normalize(), new BABYLON.Vector3(-1, -1, 0).normalize()),
                ];
                template.trackTemplates[0].drawEndTip = true;

                template.trackTemplates[1] = new TrackTemplate(template);
                template.trackTemplates[1].colorIndex = 1;
                template.trackTemplates[1].trackpoints = [
                    new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-tileWidth * 0.5, tileHeight * h + 0, 0), dirLeft),
                    new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(tileWidth * 0.4 + cupR -0.02, tileHeight * 0.4 + tileHeight * h, 0), dirRight)
                ];
            }
            else {
                template.trackTemplates[0] = new TrackTemplate(template);
                template.trackTemplates[0].trackpoints = [
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, tileHeight * 3, 0), dir),
    
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 - 1.6 * cupR, tileHeight * 3 - dH + 0, 0), dir),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 - 0, tileHeight * 3 - dH - cupR * 0.8 + 0, 0), dir),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR, tileHeight * 3 - dH + 0, 0), norm),
    
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR, tileHeight * 1.5 + tileHeight * h + 0, 0), norm),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR + 0.01, 0.025 + tileHeight * 1.5 + tileHeight * h + 0, 0), Tools.V3Dir(45), Tools.V3Dir(- 45)),
                ];
                template.trackTemplates[0].drawEndTip = true;
            }

            template.initialize();

            return template;
        }

        public dispose(): void {
            super.dispose();
            clearTimeout(this.delayTimeout);
            this.machine.onStopCallbacks.remove(this.reset);
        }

        public reset = () => {
            clearTimeout(this.delayTimeout);
            this.shieldClose = false;
            this.shield.position.y = this.shieldYClosed + this.shieldLength;
            this.shield.freezeWorldMatrix();
            this.shieldCollider.freezeWorldMatrix();

            this.currentShootState = 0;
            let x = 1;
            this.kicker.position.copyFromFloats(x * tileWidth * 0.4 - 0, this.kickerYIdle, 0);
            this._freezeKicker();
        };

        public get shieldOpened(): boolean {
            return this.shield.position.y >= this.shieldYClosed + this.shieldLength;
        }

        public get shieldClosed(): boolean {
            return this.shield.position.y <= this.shieldYClosed;
        }

        public getBallReady(): Ball {
            let center = new BABYLON.Vector3(
                this.kicker.position.x,
                tileHeight * 3,
                0
            );
            BABYLON.Vector3.TransformCoordinatesToRef(center, this.getWorldMatrix(), center);
            Mummu.DrawDebugPoint(center, 2, BABYLON.Color3.Red(), 0.05);
            for (let i = 0; i < this.machine.balls.length; i++) {
                let ball = this.machine.balls[i];
                if (Math.abs(ball.position.y - center.y) < tileHeight) {
                    let delta = ball.position.subtract(center);
                    delta.y = 0;
                    let distance = delta.length();
                    if (distance < ball.radius + this.kickerRadius + 0.001) {
                        return ball;
                    }
                }
            }
            return undefined;
        }

        public getBallArmed(): Ball {
            let center = new BABYLON.Vector3(
                this.kicker.position.x,
                tileHeight * 3,
                0
            );
            BABYLON.Vector3.TransformCoordinatesToRef(center, this.getWorldMatrix(), center);
            Mummu.DrawDebugPoint(center, 200, BABYLON.Color3.Green(), 0.05);
            for (let i = 0; i < this.machine.balls.length; i++) {
                let ball = this.machine.balls[i];
                if (ball.velocity.length() < 0.02 && Math.abs(ball.velocity.x) < 0.001) {
                    if (BABYLON.Vector3.DistanceSquared(center, ball.position) < 0.005 * 0.005) {
                        return ball;
                    }
                }
            }
        }

        public shieldClose: boolean = false;
        public currentShootState: number = 0;
        public shieldSpeed: number = 0.15;
        public delayTimeout: number = 0;

        public update(dt: number): void {
            super.update(dt);
            if (this.shieldClose && !this.shieldClosed) {
                if (this.shield.position.y > this.shieldYClosed + this.shieldSpeed * dt * this.game.currentTimeFactor) {
                    this.shield.position.y -= this.shieldSpeed * dt * this.game.currentTimeFactor;
                    this.shield.freezeWorldMatrix();
                    this.shieldCollider.freezeWorldMatrix();
                }
                else {
                    this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                    this.clicSound.play();
                    this.shield.position.y = this.shieldYClosed;
                    this.shield.freezeWorldMatrix();
                    this.shieldCollider.freezeWorldMatrix();
                }
            }
            else if (!this.shieldClose && !this.shieldOpened) {
                if (this.shield.position.y < this.shieldYClosed + this.shieldLength - this.shieldSpeed * dt * this.game.currentTimeFactor) {
                    this.shield.position.y += this.shieldSpeed * dt * this.game.currentTimeFactor;
                    this.shield.freezeWorldMatrix();
                    this.shieldCollider.freezeWorldMatrix();
                }
                else {
                    this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                    this.clicSound.play();
                    this.shield.position.y = this.shieldYClosed + this.shieldLength;
                    this.shield.freezeWorldMatrix();
                    this.shieldCollider.freezeWorldMatrix();
                }
            }

            if (this.currentShootState === 0) {
                this.shieldClose = false;
                this.hasCollidingKicker = true;

                if (this.getBallReady()) {
                    this.currentShootState = 0.5;
                    this.delayTimeout = setTimeout(() => {
                        this.currentShootState = 1;
                    }, 500 / this.game.currentTimeFactor);
                }
            }
            else if (this.currentShootState === 1) {
                this.shieldClose = false;
                this.hasCollidingKicker = true;

                this.currentShootState = 1.5;
                this.animateKickerArm(this.kickerYIdle - this.kickerLength, 1.5  / this.game.currentTimeFactor).then(() => {
                    this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                    this.clicSound.play();
                    this.delayTimeout = setTimeout(() => {
                        this.currentShootState = 2;
                    }, 500 / this.game.currentTimeFactor);
                });
            }
            else if (this.currentShootState === 2) {
                this.shieldClose = true;
                this.hasCollidingKicker = true;

                if (this.shieldClosed) {
                    this.currentShootState = 2.5;
                    this.delayTimeout = setTimeout(() => {
                        this.currentShootState = 3;
                    }, 400 / this.game.currentTimeFactor);
                }
            }
            else if (this.currentShootState === 3) {
                this.shieldClose = true;
                this.hasCollidingKicker = false;

                let ballArmed = this.getBallArmed();
                if (ballArmed) {
                    if (this.h === 3) {
                        // This is not real physic. It just works.
                        ballArmed.flybackOrigin = ballArmed.position.clone();
                        ballArmed.flybackDestination = ballArmed.positionZero.clone().add(this.machine.root.position);
                        ballArmed.flybackPeak = ballArmed.flybackOrigin.add(ballArmed.flybackDestination).scaleInPlace(0.5);
                        let d = BABYLON.Vector3.Distance(ballArmed.flybackOrigin, ballArmed.flybackDestination);
                        d = Math.max(d, 0.4);
                        ballArmed.flybackPeak.y = Math.max(ballArmed.flybackOrigin.y, ballArmed.flybackDestination.y) + d * 3;
                        ballArmed.flyBackProgress = 0;

                        let truePeakY = ballArmed.flybackOrigin.y;
                        let dirOrigin = ballArmed.flybackPeak.subtract(ballArmed.flybackOrigin);
                        let dirDestination = ballArmed.flybackDestination.subtract(ballArmed.flybackPeak);
                        for (let test = 0; test < 100; test++) {
                            let p = BABYLON.Vector3.Hermite(ballArmed.flybackOrigin, dirOrigin, ballArmed.flybackDestination, dirDestination, test / 100);
                            truePeakY = Math.max(truePeakY, p.y);
                        }
                        let v0 = Math.sqrt(9.8 * 2 * (truePeakY - ballArmed.flybackOrigin.y));
                        let tPeak = v0 / 9.8;
                        ballArmed.flyBackDuration = tPeak * 1.7;
                        ballArmed.collisionState = CollisionState.Flyback;
                        ballArmed.marbleChocSound.setVolume(2);
                        ballArmed.marbleChocSound.setPlaybackRate(this.game.currentTimeFactor);
                        ballArmed.marbleChocSound.play();
                        this.currentShootState = 4;
                    }
                    else {
                        ballArmed.velocity.copyFromFloats(0, this.velocityKick, 0);
                        ballArmed.marbleChocSound.setVolume(2);
                        ballArmed.marbleChocSound.setPlaybackRate(this.game.currentTimeFactor);
                        ballArmed.marbleChocSound.play();
                        this.currentShootState = 4;
                    }
                }
                else {
                    let ballReady = this.getBallReady();
                    if (!ballReady) {
                        this.currentShootState = 4;
                    }
                }
            }
            else if (this.currentShootState === 4) {
                this.shieldClose = true;
                this.hasCollidingKicker = false;

                this.currentShootState = 4.5;
                this.animateKickerKick(this.kickerYIdle, 0.8  / this.game.currentTimeFactor).then(() => {
                    this.delayTimeout = setTimeout(() => {
                        this.currentShootState = 5;
                    }, this.n * 1000 / this.game.currentTimeFactor);
                });
            }
            else if (this.currentShootState === 5) {
                this.shieldClose = false;
                this.hasCollidingKicker = true;
                
                if (this.shieldOpened) {
                    this.currentShootState = 0;
                }
            }
        }

        private _freezeKicker(): void {
            this.kicker.freezeWorldMatrix();
            this.kicker.getChildMeshes().forEach(child => {
                child.freezeWorldMatrix();
            })
        }
    }
}
