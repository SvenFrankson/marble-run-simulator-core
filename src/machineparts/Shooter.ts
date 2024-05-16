namespace MarbleRunSimulatorCore {
    export class Shooter extends MachinePart {
        
        public static velocityKicks: number[] = [
            1,
            1,
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

        public kickerRadius: number = 0.0025;
        public kickerLength: number = 0.04;
        public kickerYIdle: number = 0;
        public kicker: BABYLON.Mesh;
        public kickerCollider: BABYLON.Mesh;
        public hasCollidingKicker: boolean = true;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            prop.h = Nabu.MinMax(prop.h, 2, 20);

            let partName = "shooter-" + prop.h.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));

            let x = 1;
            if (prop.mirrorX) {
                x = -1;
            }

            this.generateWires();

            this.velocityKick = Shooter.velocityKicks[this.h];

            this.kicker = BABYLON.MeshBuilder.CreateBox("kicker", { width: 2 * this.kickerRadius, height: 2 * this.kickerLength, depth: 2 * this.kickerRadius });
            this.kickerCollider = this.kicker;

            let cupR = 0.006;
            let dH = 0.001;
            this.kickerYIdle = -tileHeight * this.h - dH - cupR * 0.8 - 0.004;
            this.kicker.parent = this;
            this.kicker.position.copyFromFloats(tileWidth * 0.4 - 0, this.kickerYIdle, 0);

            this.machine.onStopCallbacks.push(this.reset);
            this.reset();

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

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * h, 0), dir),

                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 - 1.6 * cupR, -tileHeight * h - dH, 0), dir),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 - 0, -tileHeight * h - dH - cupR * 0.8, 0), dir),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR, -tileHeight * h - dH, 0), n),

                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR, - tileHeight, 0), n),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.4 + cupR - 0.015, 0.035 - tileHeight, 0), new BABYLON.Vector3(-1, 1, 0).normalize(), new BABYLON.Vector3(-1, -1, 0).normalize()),
            ];
            template.trackTemplates[0].drawEndTip = true;

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight, 0), dirLeft),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(tileWidth * 0.4 + cupR -0.02, -tileHeight * 0.6, 0), dirRight)
            ];

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
            
        };

        public currentShootState: number = 0;
        public update(dt: number): void {
            let balls = this.machine.balls;
            let center = new BABYLON.Vector3(0.0301, - tileHeight * this.h - 0.0004, 0);
            center.addInPlace(this.position);
            if (this.currentShootState === 0) {
                this.hasCollidingKicker = true;
                for (let i = 0; i < balls.length; i++) {
                    let ball = balls[i];
                    if (Math.abs(ball.position.x - this.kickerCollider.absolutePosition.x) < ball.radius + this.kickerRadius + 0.001) {
                        if (Math.abs(ball.position.z - this.kickerCollider.absolutePosition.z) < 0.001) {
                            this.currentShootState = 1;
                        }
                        this.currentShootState = 1;
                    }
                }
            }
            else if (this.currentShootState === 1) {
                this.hasCollidingKicker = true;
                if (this.kicker.position.y > this.kickerYIdle - this.kickerLength) {
                    this.kicker.position.y -= 0.02 * dt;
                    this.kicker.freezeWorldMatrix();
                }
                else {
                    this.kicker.position.y = this.kickerYIdle - this.kickerLength;
                    this.kicker.freezeWorldMatrix();
                    this.currentShootState = 2;
                }
            }
            else if (this.currentShootState === 2) {
                this.hasCollidingKicker = false;
                for (let i = 0; i < balls.length; i++) {
                    if (balls[i].velocity.length() < 0.02 && Math.abs(balls[i].velocity.x) < 0.001) {
                        console.log(balls[i].position.subtract(this.position).subtractFromFloats(0, -tileHeight * this.h, 0));
                        if (BABYLON.Vector3.DistanceSquared(center, balls[i].position) < 0.0005 * 0.0005) {
                            balls[i].velocity.copyFromFloats(0, this.velocityKick, 0);
                            this.currentShootState = 3;
                            let ball = balls[i];
                            ball.debugNextYFlip = () => {
                                let y = this.position.y - ball.position.y;
                                if (y < 0.004) {
                                    console.log(this.h + " too fast");
                                    Shooter.velocityKicks[this.h] -= 0.005;
                                }
                                else if (y > 0.006) {
                                    console.log(this.h + " too slow");
                                    Shooter.velocityKicks[this.h] += 0.005;
                                }
                                else {
                                    console.log(this.h + " ok");
                                    console.log(Shooter.velocityKicks);
                                }
                                this.velocityKick = Shooter.velocityKicks[this.h];
                            }
                        }
                    }
                }
            }
            else if (this.currentShootState === 3) {
                this.hasCollidingKicker = false;
                if (this.kicker.position.y < this.kickerYIdle) {
                    this.kicker.position.y += this.velocityKick * dt;
                    this.kicker.freezeWorldMatrix();
                }
                else {
                    this.kicker.position.y = this.kickerYIdle
                    this.kicker.freezeWorldMatrix();
                    this.currentShootState = 4;
                    this.hasCollidingKicker = true;
                    setTimeout(() => {
                        this.currentShootState = 0;
                    }, 1000);
                }
            }
        }

        public async kick(ball: Ball): Promise<void> {

        }
    }
}
