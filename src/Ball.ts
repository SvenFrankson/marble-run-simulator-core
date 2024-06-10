namespace MarbleRunSimulatorCore {
    export class BallGhost extends BABYLON.Mesh {
        constructor(public ball: Ball) {
            super(ball.name + "-ghost");
        }
    }

    export enum Surface {
        Rail,
        Bowl,
        Velvet
    }

    export enum CollisionState {
        Normal,
        Inside,
        Exit,
        Flyback
    }

    export class Ball extends BABYLON.Mesh {
        public static ConstructorIndex: number = 0;
        public constructorIndex: number = 0;

        public get game(): IGame {
            return this.machine.game;
        }

        public size: number = 0.016;
        public get radius(): number {
            return this.size * 0.5;
        }
        public get volume(): number {
            return (4 / 3) * Math.PI * Math.pow(this.size * 0.5, 3);
        }
        public get mass(): number {
            return 7850 * this.volume;
        }
        public get sectionArea(): number {
            return Math.PI * this.radius * this.radius;
        }
        public velocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public rotationSpeed: number = 0;
        public rotationAxis: BABYLON.Vector3 = BABYLON.Vector3.Right();
        public surface: Surface = Surface.Rail;

        public _showPositionZeroGhost: boolean = false;
        public get showPositionZeroGhost(): boolean {
            return this._showPositionZeroGhost;
        }
        public setShowPositionZeroGhost(v: boolean): void {
            this._showPositionZeroGhost = v;
            if (this.positionZeroGhost) {
                this.positionZeroGhost.isVisible = v;
            }
        }
        public positionZeroGhost: BABYLON.Mesh;
        public selectedMesh: BABYLON.Mesh;

        public get materialIndex(): number {
            return this._materialIndex;
        }
        public set materialIndex(v: number) {
            this._materialIndex = v;
            this.material = this.game.materials.getBallMaterial(this.materialIndex);
        }

        public setPositionZero(p: BABYLON.Vector3): void {
            this.positionZero.copyFrom(p);
            this.positionZero.x = Math.round(this.positionZero.x * 1000) / 1000;
            this.positionZero.y = Math.round(this.positionZero.y * 1000) / 1000;
            this.positionZero.z = Math.round(this.positionZero.z / tileDepth) * tileDepth;
            this.positionZeroGhost.position.copyFrom(this.positionZero);
        }

        public get k(): number {
            return -Math.round(this.positionZero.z / tileDepth);
        }
        public set k(v: number) {
            this.positionZero.z = -Math.round(v) * tileDepth;
            this.positionZeroGhost.position.copyFrom(this.positionZero);
        }

        public bumpSurfaceIsRail?: boolean = true;
        public marbleChocSound: BABYLON.Sound;
        public railBumpSound: BABYLON.Sound;
        public marbleLoopSound: BABYLON.Sound;
        public marbleBowlLoopSound: BABYLON.Sound;
        public marbleBowlInsideSound: BABYLON.Sound;

        public flybackOrigin: BABYLON.Vector3;
        public flybackDestination: BABYLON.Vector3;
        public flybackPeak: BABYLON.Vector3;
        public flyBackProgress: number = 0;
        public flyBackDuration: number = 1;
        public animatePosition = Mummu.AnimationFactory.EmptyVector3Callback;

        constructor(public positionZero: BABYLON.Vector3, public machine: Machine, private _materialIndex: number = 0) {
            super("ball");
            this.rotationQuaternion = BABYLON.Quaternion.Identity();
            this.constructorIndex = Ball.ConstructorIndex++;
            this.marbleChocSound = new BABYLON.Sound("marble-choc-sound", "./lib/marble-run-simulator-core/datas/sounds/marble-choc.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.railBumpSound = new BABYLON.Sound("rail-bump-sound", "./lib/marble-run-simulator-core/datas/sounds/rail-bump.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.marbleLoopSound = new BABYLON.Sound("marble-loop-sound", "./lib/marble-run-simulator-core/datas/sounds/marble-loop-2.wav", this.getScene(), undefined, { loop: true, autoplay: true });
            this.marbleLoopSound.setVolume(0);
            this.marbleBowlLoopSound = new BABYLON.Sound("marble-bowl-loop-sound", "./lib/marble-run-simulator-core/datas/sounds/marble-bowl-loop.wav", this.getScene(), undefined, { loop: true, autoplay: true });
            this.marbleBowlLoopSound.setVolume(0);
            this.marbleBowlInsideSound = new BABYLON.Sound("marble-bowl-inside-sound", "./lib/marble-run-simulator-core/datas/sounds/ball_roll_wood_noloop.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.marbleBowlInsideSound.setVolume(0.2);

            this.animatePosition = Mummu.AnimationFactory.CreateVector3(this, this, "position");
        }

        public select(): void {
            this.selectedMesh.isVisible = true;
        }

        public unselect(): void {
            this.selectedMesh.isVisible = false;
        }

        public setIsVisible(isVisible: boolean): void {
            this.isVisible = isVisible;
            this.getChildMeshes().forEach((m) => {
                m.isVisible = isVisible;
            });
        }

        public async instantiate(hotReload?: boolean): Promise<void> {
            this.marbleLoopSound.setVolume(0);
            this.marbleBowlLoopSound.setVolume(0);
            let segmentsCount = 6;
            if (this.game.getGeometryQ() === GeometryQuality.Medium) {
                segmentsCount = 10;
            }
            else if (this.game.getGeometryQ() === GeometryQuality.High) {
                segmentsCount = 14;
            }
            let data = BABYLON.CreateSphereVertexData({ diameter: this.size, segments: segmentsCount});
            let uvs = data.uvs;
            for (let i = 0; i < uvs.length / 2; i++) {
                uvs[2 * i] *= - 2;
            }
            data.applyToMesh(this);

            this.material = this.game.materials.getBallMaterial(this.materialIndex);

            if (this.positionZeroGhost) {
                this.positionZeroGhost.dispose();
            }
            this.positionZeroGhost = new BallGhost(this);
            BABYLON.CreateSphereVertexData({ diameter: this.size * 0.95, segments: segmentsCount}).applyToMesh(this.positionZeroGhost);
            this.positionZeroGhost.material = this.game.materials.ghostMaterial;
            this.positionZeroGhost.position.copyFrom(this.positionZero);
            this.positionZeroGhost.isVisible = this._showPositionZeroGhost;

            if (this.selectedMesh) {
                this.selectedMesh.dispose();
            }
            let points: BABYLON.Vector3[] = [];
            for (let i = 0; i <= 32; i++) {
                let a = (i / 32) * 2 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                points.push(new BABYLON.Vector3(cosa * (this.radius + 0.005), sina * (this.radius + 0.005), 0));
            }
            this.selectedMesh = BABYLON.MeshBuilder.CreateLines("select-mesh", {
                points: points,
            });
            this.selectedMesh.parent = this.positionZeroGhost;
            this.selectedMesh.isVisible = false;

            if (!hotReload) {
                this.reset();
            }
        }

        public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void {
            super.dispose(doNotRecurse, disposeMaterialAndTextures);

            this.marbleLoopSound.setVolume(0, 0.1);
            this.marbleLoopSound.pause();
            this.marbleBowlLoopSound.setVolume(0, 0.1);
            this.marbleBowlLoopSound.pause();
            if (this.positionZeroGhost) {
                this.positionZeroGhost.dispose();
            }
            let index = this.machine.balls.indexOf(this);
            if (index > -1) {
                this.machine.balls.splice(index, 1);
            }
        }

        public reset(): void {
            if (this.rotationQuaternion) {
                this.rotationQuaternion.copyFromFloats(0, 0, 0, 1);
            }
            this.velocity.copyFromFloats(0, 0, 0);
            this._timer = 0;
            this.collisionState = CollisionState.Normal;
            this.marbleLoopSound.setVolume(0, 0.1);
            this.marbleBowlLoopSound.setVolume(0, 0.1);
            this.animatePosition(this.positionZero, 0);
        }

        private memCount = 2;
        private _lastWires: Wire[] = [];
        private _lastWireIndexes: number[] = [];
        private _pouet: number = 0;
        public getLastIndex(wire: Wire): number {
            for (let i = 0; i < this.memCount; i++) {
                if (this._lastWires[i] === wire) {
                    return this._lastWireIndexes[i];
                }
            }
            return -1;
        }
        public setLastHit(wire: Wire, index: number): void {
            for (let i = 0; i < this.memCount; i++) {
                if (this._lastWires[i] === wire) {
                    this._lastWireIndexes[i] = index;
                    return;
                }
            }
            this._pouet = (this._pouet + 1) % this.memCount;
            this._lastWires[this._pouet] = wire;
            this._lastWireIndexes[this._pouet] = index;
        }

        public debugNextYFlip: () => void;

        public averageWithOptim = 0;
        public averageNoOptim = 0;
        public optimCount = 0;
        public totalCount = 0;
        private _timer: number = 0;
        public strReaction: number = 0;
        
        public lastPosition: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public visibleVelocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public collisionState: number = CollisionState.Normal;
        public recordedPositions: BABYLON.Vector3[] = [];

        public update(dt: number): void {
            if (this.game.DEBUG_MODE && (this.recordedPositions.length === 0 || BABYLON.Vector3.Distance(this.position, this.recordedPositions[this.recordedPositions.length - 1]) > 0.01 && this.recordedPositions.length < 1000)) {
                this.recordedPositions.push(this.position.clone());
            }
            let sign = Math.sign(this.velocity.y);
            if (this.collisionState === CollisionState.Normal && this.position.y < this.machine.baseMeshMinY - 0.15) {
                this.collisionState = CollisionState.Inside;
                this.marbleBowlInsideSound.setPlaybackRate(this.game.currentTimeFactor);
                this.marbleBowlInsideSound.play();
                let tmpDestination = this.machine.exitHoleOut.absolutePosition.clone();
                tmpDestination.z += 0.05;
                this.animatePosition(tmpDestination, 2.7 / this.game.currentTimeFactor - 0.1).then(() => {
                    this.animatePosition(this.machine.exitHoleOut.absolutePosition, 0.1).then(() => {
                        this.collisionState = CollisionState.Exit;
                        this.velocity.copyFromFloats(0, 0, - 0.2);
                    })
                });
            }

            this._timer += dt;
            this._timer = Math.min(this._timer, 1);

            while (this._timer > 0) {
                let m = this.mass;
                let physicDT = this.game.physicDT;
                let f = this.velocity.length();
                f = Math.max(Math.min(f, 1), 0.4);
                this._timer -= physicDT / f;

                let weight = new BABYLON.Vector3(0, -9 * m, 0);
                let reactions = BABYLON.Vector3.Zero();
                let reactionsCount = 0;

                let forcedDisplacement = BABYLON.Vector3.Zero();
                let canceledSpeed = BABYLON.Vector3.Zero();

                this.bumpSurfaceIsRail = true;
                let collisionableParts: MachinePart[];
                if (this.collisionState === CollisionState.Normal) {
                    collisionableParts = this.machine.parts;
                }
                if (this.collisionState === CollisionState.Exit) {
                    collisionableParts = [this.machine.exitShooter, this.machine.exitTrack];
                }
                if (collisionableParts) {
                    collisionableParts.forEach((part) => {
                        if (Mummu.SphereAABBCheck(this.position, this.radius, part.AABBMin.x - this.radius, part.AABBMax.x + this.radius, part.AABBMin.y - this.radius, part.AABBMax.y + this.radius, part.AABBMin.z - this.radius, part.AABBMax.z + this.radius)) {
                            part.allWires.forEach((wire) => {
                                let index = this.getLastIndex(wire);
                                let col: Mummu.IIntersection;
                                /*
                            if (this.constructorIndex === 0) {
                                if (index > - 1) {
                                    this.optimCount++;
                                    let t0 = performance.now();
                                    col = Mummu.SphereWireIntersection(this.position, this.radius, wire.absolutePath, wire.size * 0.5, true, index);
                                    this.setLastHit(wire, col.index);
                                    let t1 = performance.now();
                                    let t = t1 - t0;
                                    this.averageWithOptim = this.averageWithOptim * 0.9999 + t * 0.0001;
                                }
                                else {
                                    let t0 = performance.now();
                                    col = Mummu.SphereWireIntersection(this.position, this.radius, wire.absolutePath, wire.size * 0.5, true, index);
                                    this.setLastHit(wire, col.index);
                                    let t1 = performance.now();
                                    let t = t1 - t0;
                                    this.averageNoOptim = this.averageNoOptim * 0.9999 + t * 0.0001;
                                }
                                this.totalCount++;
                                if (Math.random() < 0.001) {
                                    let optimRate = this.optimCount / this.totalCount * 100;
                                    console.log("optim rate " + optimRate.toFixed(3) + " %");
                                    console.log("averageWithOptim " + this.averageWithOptim.toFixed(6) + " ms");
                                    console.log("averageNoOptim " + this.averageNoOptim.toFixed(6) + " ms");
                                }
                            }
                            else {
                                */
                                let f = Nabu.MinMax(this.velocity.lengthSquared(), 0, 1);
                                let range = Math.round(f * 32 + (1 - f) * 2);
                                col = Mummu.SphereWireIntersection(this.position, this.radius, wire.absolutePath, wire.size * 0.5, !(part instanceof Spiral), index, range);
                                //}
                                if (col.hit) {
                                    //this.setLastHit(wire, col.index);
                                    let colDig = col.normal.scale(-1);
                                    // Move away from collision
                                    forcedDisplacement.addInPlace(col.normal.scale(col.depth));
                                    // Cancel depth component of speed
                                    let depthSpeed = BABYLON.Vector3.Dot(this.velocity, colDig);
                                    if (depthSpeed > 0) {
                                        canceledSpeed.addInPlace(colDig.scale(depthSpeed));
                                    }
                                    // Add ground reaction
                                    let reaction = col.normal.scale(col.depth * 1000); // 1000 is a magic number.
                                    reactions.addInPlace(reaction);
                                    reactionsCount++;
    
                                    this.surface = Surface.Rail;
    
                                    if (part instanceof Elevator) {
                                        this.position.z = part.absolutePosition.z;
                                        this.velocity.z = 0;
                                    }
                                }
                            });
                            part.decors.forEach(decor => {
                                decor.onBallCollideAABB(this);
                            })
                            if (part instanceof GravityWell) {
                                let col = Mummu.SphereLatheIntersection(this.position, this.radius, part.wellMesh.absolutePosition, part.wellPath);
                                if (col.hit) {
                                    //this.setLastHit(wire, col.index);
                                    let colDig = col.normal.scale(-1);
                                    // Move away from collision
                                    forcedDisplacement.addInPlace(col.normal.scale(col.depth));
                                    // Cancel depth component of speed
                                    let depthSpeed = BABYLON.Vector3.Dot(this.velocity, colDig);
                                    if (depthSpeed > 0) {
                                        canceledSpeed.addInPlace(colDig.scale(depthSpeed));
                                    }
                                    // Add ground reaction
                                    let reaction = col.normal.scale(col.depth * 1000); // 1000 is a magic number.
                                    reactions.addInPlace(reaction);
                                    reactionsCount++;
    
                                    let dyFix = Math.abs(this.position.y - (part.wellMesh.absolutePosition.y - 0.01));
                                    if (dyFix < 0.001) {
                                        this.velocity.z = 0;
                                    }
    
                                    this.surface = Surface.Bowl;
                                    this.bumpSurfaceIsRail = false;
                                }
                            }
                            if (part instanceof Stairway) {
                                part.boxesColliders.forEach((box) => {
                                    let col = Mummu.SphereMeshIntersection(this.position, this.radius, box);
                                    if (col.hit) {
                                        //this.setLastHit(wire, col.index);
                                        let colDig = col.normal.scale(-1);
                                        // Move away from collision
                                        forcedDisplacement.addInPlace(col.normal.scale(col.depth));
                                        // Cancel depth component of speed
                                        let depthSpeed = BABYLON.Vector3.Dot(this.velocity, colDig);
                                        if (depthSpeed > 0) {
                                            canceledSpeed.addInPlace(colDig.scale(depthSpeed));
                                        }
                                        // Add ground reaction
                                        let reaction = col.normal.scale(col.depth * 1000 * this.velocity.length()); // 1000 is a magic number.
                                        reactions.addInPlace(reaction);
                                        reactionsCount++;
    
                                        this.position.z = box.absolutePosition.z;
                                        this.velocity.z = 0;
    
                                        this.bumpSurfaceIsRail = false;
                                    }
                                });
                            }
                            if (part instanceof Shooter && part.hasCollidingKicker) {
                                let col = Mummu.SphereMeshIntersection(this.position, this.radius, part.kickerCollider);
                                if (col.hit) {
                                    //this.setLastHit(wire, col.index);
                                    let colDig = col.normal.scale(-1);
                                    // Move away from collision
                                    forcedDisplacement.addInPlace(col.normal.scale(col.depth));
                                    // Cancel depth component of speed
                                    let depthSpeed = BABYLON.Vector3.Dot(this.velocity, colDig);
                                    if (depthSpeed > 0) {
                                        canceledSpeed.addInPlace(colDig.scale(depthSpeed));
                                    }
                                    // Add ground reaction
                                    let reaction = col.normal.scale(col.depth * 1000 * this.velocity.length()); // 1000 is a magic number.
                                    reactions.addInPlace(reaction);
                                    reactionsCount++;
                                    this.bumpSurfaceIsRail = false;
                                }
                            }
                            if (part instanceof Shooter) {
                                let col = Mummu.SphereMeshIntersection(this.position, this.radius, part.shieldCollider);
                                if (col.hit) {
                                    //this.setLastHit(wire, col.index);
                                    let colDig = col.normal.scale(-1);
                                    // Move away from collision
                                    forcedDisplacement.addInPlace(col.normal.scale(col.depth));
                                    // Cancel depth component of speed
                                    let depthSpeed = BABYLON.Vector3.Dot(this.velocity, colDig);
                                    if (depthSpeed > 0) {
                                        canceledSpeed.addInPlace(colDig.scale(depthSpeed));
                                    }
                                    // Add ground reaction
                                    let reaction = col.normal.scale(col.depth * 1000 * this.velocity.length()); // 1000 is a magic number.
                                    reactions.addInPlace(reaction);
                                    reactionsCount++;
                                    this.bumpSurfaceIsRail = false;
                                }
                            }
                            if (part instanceof Controler) {
                                let col = Mummu.SphereMeshIntersection(this.position, this.radius, part.pivotControlerCollider);
                                if (col.hit) {
                                    // Move away from collision
                                    forcedDisplacement.addInPlace(col.normal.scale(col.depth));
                                    if (this.velocity.length() > 0.5) {
                                        this.velocity.scaleInPlace(0.9);
                                    }
                                }
                            }
                            if (part instanceof Screen) {
                                let col = Mummu.SphereMeshIntersection(this.position, this.radius, part.cameInCollider);
                                if (col.hit) {
                                    // Move away from collision
                                    forcedDisplacement.addInPlace(col.normal.scale(col.depth));
                                    if (this.velocity.length() > 0.5) {
                                        this.velocity.scaleInPlace(0.99);
                                    }
                                }
                                else if (part.isMoving && !part.isInside(this)) {
                                    col = Mummu.SphereMeshIntersection(this.position, this.radius, part.cameOutCollider);
                                    if (col.hit) {
                                        //this.setLastHit(wire, col.index);
                                        col.normal.y = 0;
                                        let colDig = col.normal.scale(-1);
                                        // Move away from collision
                                        forcedDisplacement.addInPlace(col.normal.scale(col.depth));
                                        // Cancel depth component of speed
                                        let depthSpeed = BABYLON.Vector3.Dot(this.velocity, colDig);
                                        if (depthSpeed > 0) {
                                            canceledSpeed.addInPlace(colDig.scale(depthSpeed));
                                        }
                                        // Add ground reaction
                                        let reaction = col.normal.scale(col.depth * 1000); // 1000 is a magic number.
                                        reactions.addInPlace(reaction);
                                        reactionsCount++;
                                    }
                                }
                            }
                            /*
                        if (part instanceof QuarterNote || part instanceof DoubleNote) {
                            part.tings.forEach(ting => {
                                let col = Mummu.SphereMeshIntersection(this.position, this.radius, ting);
                                if (col.hit) {
                                    if (BABYLON.Vector3.Dot(this.velocity, col.normal) < 0) {
                                        part.notes[0].play();
                                        console.log(part.notes[0].name);
                                        BABYLON.Vector3.ReflectToRef(this.velocity, col.normal, this.velocity);
                                        if (this.velocity.length() > 0.8) {
                                            this.velocity.normalize().scaleInPlace(0.8);
                                        }
                                    }
                                }
                            })
                        }
                        */
                        }
                    });
                }
                
                // Collide with playground limits
                if (this.collisionState === CollisionState.Normal) {
                    if (this.position.x - this.radius < this.machine.baseMeshMinX - this.machine.margin + 0.015) {
                        this.velocity.x = Math.abs(this.velocity.x) * 0.5;
                        this.position.x = this.machine.baseMeshMinX - this.machine.margin + 0.015 + this.radius;
                    }
                    if (this.position.x + this.radius > this.machine.baseMeshMaxX + this.machine.margin - 0.015) {
                        this.velocity.x = - Math.abs(this.velocity.x) * 0.5;
                        this.position.x = this.machine.baseMeshMaxX + this.machine.margin - 0.015 - this.radius;
                    }
                    if (this.position.z - this.radius < this.machine.baseMeshMinZ - this.machine.margin + 0.015) {
                        this.velocity.z = Math.abs(this.velocity.z) * 0.5;
                        this.position.z = this.machine.baseMeshMinZ - this.machine.margin + 0.015 + this.radius;
                    }
                    if (this.position.z + this.radius > this.machine.baseMeshMaxZ + this.machine.margin - 0.015) {
                        this.velocity.z = - Math.abs(this.velocity.z) * 0.5;
                        this.position.z = this.machine.baseMeshMaxZ + this.machine.margin - 0.015 - this.radius;
                    }
                    let colExitInHole = Mummu.SphereLatheIntersection(this.position, this.radius, this.machine.exitHoleIn.absolutePosition, this.machine.exitHolePath);
                    if (colExitInHole.hit) {
                        //this.setLastHit(wire, col.index);
                        let colDig = colExitInHole.normal.scale(-1);
                        // Move away from collision
                        forcedDisplacement.addInPlace(colExitInHole.normal.scale(colExitInHole.depth));
                        // Cancel depth component of speed
                        let depthSpeed = BABYLON.Vector3.Dot(this.velocity, colDig);
                        if (depthSpeed > 0) {
                            canceledSpeed.addInPlace(colDig.scale(depthSpeed));
                        }
                        // Add ground reaction
                        let reaction = colExitInHole.normal.scale(colExitInHole.depth * 1000); // 1000 is a magic number.
                        reactions.addInPlace(reaction);
                        reactionsCount++;

                        if (this.position.y < this.machine.exitHoleIn.absolutePosition.y - 0.05) {
                            this.velocity.x *= 0.99;
                            this.velocity.z *= 0.99;
                        }

                        this.surface = Surface.Bowl;
                        this.bumpSurfaceIsRail = false;
                    }
                    else {
                        // Check for hole in pedestalTop
                        let dx = this.position.x - this.machine.exitHoleIn.absolutePosition.x;
                        let dy = this.position.z - this.machine.exitHoleIn.absolutePosition.z;
                        let sqrDistToExitHoleAxis = dx * dx + dy * dy;
                        if (sqrDistToExitHoleAxis > 0.01835 * 0.01835) {
                            let col = Mummu.SpherePlaneIntersection(this.position, this.radius, this.machine.pedestalTop.position, BABYLON.Vector3.Up());
                            if (col.hit) {
                                //this.setLastHit(wire, col.index);
                                let colDig = col.normal.scale(-1);
                                // Move away from collision
                                forcedDisplacement.addInPlace(col.normal.scale(col.depth));
                                // Cancel depth component of speed
                                let depthSpeed = BABYLON.Vector3.Dot(this.velocity, colDig);
                                if (depthSpeed > 0) {
                                    canceledSpeed.addInPlace(colDig.scale(depthSpeed));
                                }
                                // Add ground reaction
                                let reaction = col.normal.scale(col.depth * 1000 * this.velocity.length()); // 1000 is a magic number.
                                reactions.addInPlace(reaction);
                                reactionsCount++;
            
                                this.surface = Surface.Velvet;
                                this.bumpSurfaceIsRail = true;
                                
                                weight.copyFromFloats(- 0.01, -1, -0.01).normalize().scaleInPlace(9 * m);
                            }
                        }
                    }
                }

                if (this.collisionState === CollisionState.Normal || this.collisionState === CollisionState.Exit) {
                    this.machine.balls.forEach((ball) => {
                        if (ball != this && ball.collisionState === this.collisionState) {
                            let dist = BABYLON.Vector3.Distance(this.position, ball.position);
                            if (dist < this.size) {
                                let depth = this.size - dist;
                                //this.velocity.scaleInPlace(0.3);
                                let otherSpeed = ball.velocity.clone();
                                let mySpeed = this.velocity.clone();
    
                                let v = this.velocity.length();
                                if (v > 0.15) {
                                    if (!this.marbleChocSound.isPlaying) {
                                        this.marbleChocSound.setVolume(((v - 0.15) / 0.85) * this.game.mainVolume);
                                        this.marbleChocSound.setPlaybackRate(this.game.currentTimeFactor);
                                        this.marbleChocSound.play();
                                    }
                                }
    
                                this.velocity.copyFrom(otherSpeed.scale(0.99));
                                ball.velocity.copyFrom(mySpeed.scale(0.99));
                                canceledSpeed.copyFromFloats(0, 0, 0);
                                //this.velocity.copyFrom(otherSpeed).scaleInPlace(.5);
                                //ball.velocity.copyFrom(mySpeed).scaleInPlace(.6);
    
                                let dir = this.position.subtract(ball.position).normalize();
                                forcedDisplacement.addInPlace(dir.scale(depth));
                                reactionsCount++;
                            }
                        }
                    });

                    if (reactionsCount > 0) {
                        reactions.scaleInPlace(1 / reactionsCount);
                        canceledSpeed.scaleInPlace(1 / reactionsCount).scaleInPlace(1);
                        forcedDisplacement.scaleInPlace(1 / reactionsCount).scaleInPlace(1);
                    }
                    let canceledSpeedLength = canceledSpeed.length();
                    if (canceledSpeedLength > 0.22) {
                        let f = Nabu.MinMax((canceledSpeedLength - 0.22) / 0.25, 0, 1);
                        let v = (1 - f) * 0.01 + f * 0.06;
                        if (this.bumpSurfaceIsRail) {
                            if (!this.railBumpSound.isPlaying) {
                                this.railBumpSound.setVolume(v);
                                this.railBumpSound.setPlaybackRate(this.game.currentTimeFactor);
                                this.railBumpSound.play();
                            }
                        }
                        else {
                            if (!this.marbleChocSound.isPlaying) {
                                this.marbleChocSound.setVolume(v * 4);
                                this.marbleChocSound.setPlaybackRate(this.game.currentTimeFactor);
                                this.marbleChocSound.play();
                            }
                        }
                    }
                    this.strReaction = this.strReaction * 0.2;
                    this.strReaction += reactions.length() * 0.8;
                    this.velocity.subtractInPlace(canceledSpeed);
                    //this.velocity.addInPlace(forcedDisplacement.scale(0.1 * 1 / dt));
                    this.position.addInPlace(forcedDisplacement);
    
                    let friction = this.velocity.scale(-1).scaleInPlace(0.001);
                    if (this.surface === Surface.Velvet) {
                        friction = this.velocity.scale(-1).scaleInPlace(0.02);
                    }
    
                    let acceleration = weight
                        .add(reactions)
                        .add(friction)
                        .scaleInPlace(1 / m);
                    this.velocity.addInPlace(acceleration.scale(physicDT));
    
                    this.position.addInPlace(this.velocity.scale(physicDT));

                    if (reactions.length() > 0) {
                        BABYLON.Vector3.CrossToRef(reactions, this.visibleVelocity, this.rotationAxis);
                        if (this.rotationAxis.lengthSquared() > 0) {
                            this.rotationAxis.normalize();
                        }
                        else {
                            this.rotationAxis.copyFromFloats(1, 0, 0);
                        }
                    }
                }
            }

            if (this.lastPosition && dt > 0) {
                this.visibleVelocity.copyFrom(this.position).subtractInPlace(this.lastPosition).scaleInPlace(1 / dt);
                if (!Mummu.IsFinite(this.visibleVelocity)) {
                    this.visibleVelocity.copyFromFloats(0, 0, 0);
                }
                if (this.visibleVelocity.lengthSquared() > 1) {
                    this.visibleVelocity.normalize();
                }
            }
            this.lastPosition.copyFrom(this.position);
            this.rotationSpeed = this.visibleVelocity.length() / (2 * Math.PI * this.radius);

            let axis = this.rotationAxis;
            let angle = this.rotationSpeed * 2 * Math.PI * dt
            this.rotate(axis, angle, BABYLON.Space.WORLD);

            if (this.collisionState === CollisionState.Flyback) {
                if (this.flybackDestination) {
                    this.flyBackProgress += dt / this.flyBackDuration;
                    let dirOrigin = this.flybackPeak.subtract(this.flybackOrigin);
                    let dirDestination = this.flybackDestination.subtract(this.flybackPeak);
                    let f = this.flyBackProgress;
                    if (f < 1) {
                        let p = BABYLON.Vector3.Hermite(this.flybackOrigin, dirOrigin, this.flybackDestination, dirDestination, f);
                        this.position.copyFrom(p);
                    }
                    else {
                        this.position.copyFrom(this.flybackDestination);
                        this.velocity.copyFrom(this.visibleVelocity);
                        this.collisionState = CollisionState.Normal;
                    }
                }
            }

            let f = Nabu.MinMax((this.velocity.length() - 0.1) / 0.9, 0, 1);
            if (this.surface === Surface.Rail) {
                this.marbleLoopSound.setPlaybackRate(this.game.currentTimeFactor * (this.visibleVelocity.length() / 5) + 0.8);
                this.marbleLoopSound.setVolume(12 * this.strReaction * f * this.game.mainVolume, 0.1);
                this.marbleBowlLoopSound.setVolume(0, 0.5);
            } else if (this.surface === Surface.Bowl) {
                this.marbleBowlLoopSound.setPlaybackRate(this.game.currentTimeFactor);
                this.marbleBowlLoopSound.setVolume(8 * this.strReaction * f * this.game.mainVolume, 0.1);
                this.marbleLoopSound.setVolume(0, 0.5);
            }
            let sign2 = Math.sign(this.velocity.y);

            if (sign != sign2 && this.debugNextYFlip) {
                this.debugNextYFlip();
                this.debugNextYFlip = undefined;
            }
        }
    }
}
