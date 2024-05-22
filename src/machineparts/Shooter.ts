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

            let partName = "shooter-" + prop.h.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));

            for (let i = this.colors.length; i < 4; i++) {
                this.colors[i] = 0;
            }

            let x = 1;
            if (prop.mirrorX) {
                x = -1;
            }

            this.generateWires();

            this.clicSound = new BABYLON.Sound("clic-sound", "./datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);

            this.velocityKick = Shooter.velocityKicks[this.h];

            this.base = new BABYLON.Mesh("base");

            this.kicker = new BABYLON.Mesh("kicker");
            this.kickerCollider = new BABYLON.Mesh("collider-kicker");
            this.kickerCollider.parent = this.kicker;
            this.kickerCollider.isVisible = false;
            this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/kicker.babylon").then(datas => {
                let data = datas[0];
                if (data) {
                    data.applyToMesh(this.kicker);
                    this.kicker.material = this.game.materials.plasticBlack;
                }
                let body = new BABYLON.Mesh("kicker-body");
                body.parent = this.kicker;
                if (datas[1]) {
                    datas[1].applyToMesh(body);
                    body.material = this.game.materials.getMetalMaterial(this.getColor(1));
                }
                let weight = new BABYLON.Mesh("kicker-weight");
                weight.parent = this.kicker;
                if (datas[2]) {
                    datas[2].applyToMesh(weight);
                    weight.material = this.game.materials.getMetalMaterial(this.getColor(3));
                }

                if (datas[4]) {
                    datas[4].applyToMesh(this.base);
                    this.base.material = this.game.materials.getMetalMaterial(this.getColor(2));
                }

                let colData = datas[3];
                if (colData) {
                    colData.applyToMesh(this.kickerCollider);
                    this.kickerCollider.isVisible = false;
                }
            });

            let cupR = 0.006;
            let dH = 0.001;
            this.kickerYIdle = -tileHeight * (this.h - 2) - dH - cupR * 0.8 - 0.004;
            this.kicker.parent = this;
            this.kicker.position.copyFromFloats(x * tileWidth * 0.4 - 0, this.kickerYIdle, 0);
            if (this.mirrorX) {
                this.kicker.rotation.y = Math.PI;
            }

            this.shield = new BABYLON.Mesh("shield");
            this.shieldCollider = new BABYLON.Mesh("collider-shield");
            this.shieldCollider.parent = this.shield;
            this.shieldCollider.isVisible = false;
            this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/shield.babylon").then(datas => {
                let data = datas[0];
                if (data) {
                    data.applyToMesh(this.shield);
                    this.shield.material = this.game.materials.getMetalMaterial(this.getColor(3));
                }
                let colData = datas[1];
                if (colData) {
                    colData.applyToMesh(this.shieldCollider);
                    this.shieldCollider.isVisible = false;
                }
            });

            this.shieldYClosed = - tileHeight * (this.h - 2);
            this.shield.position.copyFromFloats(x * tileWidth * 0.4 - 0, this.shieldYClosed, 0);
            if (this.mirrorX) {
                this.shield.rotation.y = Math.PI;
            }
            this.shield.parent = this;
            
            this.base.position.copyFromFloats(x * tileWidth * 0.4 - 0, this.shieldYClosed - 0.02, 0);
            if (this.mirrorX) {
                this.base.rotation.y = Math.PI;
            }
            this.base.parent = this;

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

            console.log("alpha");
        }

        public static GenerateTemplate(h: number, mirrorX: boolean) {
            let template = new MachinePartTemplate();

            template.partName = "shooter-" + h.toFixed(0);
            template.w = 1;
            template.h = h;
            template.mirrorX = mirrorX;

            template.yExtendable = true;
            template.xMirrorable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

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
                template.trackTemplates[0].trackpoints = [
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * (h - 2), 0), dir),
    
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 - 1.6 * cupR, -tileHeight * (h - 2) - dH, 0), dir),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 - 0, -tileHeight * (h - 2) - dH - cupR * 0.8, 0), dir),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR, -tileHeight * (h - 2) - dH, 0), n),
    
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR, - tileHeight, 0), n),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR - 0.015, 0.035 - tileHeight, 0), new BABYLON.Vector3(-1, 1, 0).normalize(), new BABYLON.Vector3(-1, -1, 0).normalize()),
                ];
                template.trackTemplates[0].drawEndTip = true;

                template.trackTemplates[1] = new TrackTemplate(template);
                template.trackTemplates[1].trackpoints = [
                    new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight, 0), dirLeft),
                    new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(tileWidth * 0.4 + cupR -0.02, -tileHeight * 0.6, 0), dirRight)
                ];
            }
            else {
                template.trackTemplates[0] = new TrackTemplate(template);
                template.trackTemplates[0].trackpoints = [
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * (h - 2), 0), dir),
    
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 - 1.6 * cupR, -tileHeight * (h - 2) - dH, 0), dir),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 - 0, -tileHeight * (h - 2) - dH - cupR * 0.8, 0), dir),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR, -tileHeight * (h - 2) - dH, 0), n),
    
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR, tileHeight * 0.5, 0), n),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR + 0.01, 0.025 + tileHeight * 0.5, 0), Tools.V3Dir(45), Tools.V3Dir(- 45)),
                ];
                template.trackTemplates[0].drawEndTip = true;
            }

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
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
            
        };

        public get shieldOpened(): boolean {
            return this.shield.position.y >= this.shieldYClosed + this.shieldLength;
        }

        public get shieldClosed(): boolean {
            return this.shield.position.y <= this.shieldYClosed;
        }

        public getBallReady(): Ball {
            for (let i = 0; i < this.machine.balls.length; i++) {
                let ball = this.machine.balls[i];
                if (Math.abs(ball.position.x - this.kickerCollider.absolutePosition.x) < ball.radius + this.kickerRadius + 0.001) {
                    if (Math.abs(ball.position.z - this.kickerCollider.absolutePosition.z) < 0.001) {
                        return ball;
                    }
                }
            }
            return undefined;
        }

        public getBallArmed(): Ball {
            let center = new BABYLON.Vector3(0.0301 * (this.mirrorX ? - 1 : 1), - tileHeight * (this.h - 2) - 0.0004, 0);
            center.addInPlace(this.position);
            for (let i = 0; i < this.machine.balls.length; i++) {
                let ball = this.machine.balls[i];
                if (ball.velocity.length() < 0.02 && Math.abs(ball.velocity.x) < 0.001) {
                    if (BABYLON.Vector3.DistanceSquared(center, ball.position) < 0.0005 * 0.0005) {
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
            if (this.shieldClose && !this.shieldClosed) {
                if (this.shield.position.y > this.shieldYClosed + this.shieldSpeed * dt * this.game.currentTimeFactor) {
                    this.shield.position.y -= this.shieldSpeed * dt * this.game.currentTimeFactor;
                    this.shield.freezeWorldMatrix();
                    this.shieldCollider.freezeWorldMatrix();
                }
                else {
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
                    this.clicSound.play();
                    this.shield.position.y = this.shieldYClosed + this.shieldLength;
                    this.shield.freezeWorldMatrix();
                    this.shieldCollider.freezeWorldMatrix();
                }
            }

            let balls = this.machine.balls;
            let center = new BABYLON.Vector3(0.0301, - tileHeight * (this.h - 2) - 0.0004, 0);
            center.addInPlace(this.position);
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
                        ballArmed.flybackOrigin = ballArmed.position.clone();
                        ballArmed.flybackDestination = ballArmed.positionZero.clone();
                        ballArmed.flybackPeak = ballArmed.flybackOrigin.add(ballArmed.flybackDestination).scaleInPlace(0.5);
                        ballArmed.flybackPeak.y = Math.max(ballArmed.flybackOrigin.y, ballArmed.flybackDestination.y) + 1.5;
                        ballArmed.flyBackProgress = 0;
                        ballArmed.collisionState = CollisionState.Flyback;
                        this.currentShootState = 4;
                    }
                    else {
                        ballArmed.velocity.copyFromFloats(0, this.velocityKick, 0);
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
                let ballReady = this.getBallReady();
                if (ballReady) {
                    ballReady.marbleChocSound.setVolume(2);
                    ballReady.marbleChocSound.play();
                }
                this.animateKickerKick(this.kickerYIdle, 0.8  / this.game.currentTimeFactor).then(() => {
                    this.currentShootState = 5;
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
