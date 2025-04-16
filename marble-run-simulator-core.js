var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class BallGhost extends BABYLON.Mesh {
        constructor(ball) {
            super(ball.name + "-ghost");
            this.ball = ball;
        }
    }
    MarbleRunSimulatorCore.BallGhost = BallGhost;
    let Surface;
    (function (Surface) {
        Surface[Surface["Rail"] = 0] = "Rail";
        Surface[Surface["Bowl"] = 1] = "Bowl";
        Surface[Surface["Velvet"] = 2] = "Velvet";
    })(Surface = MarbleRunSimulatorCore.Surface || (MarbleRunSimulatorCore.Surface = {}));
    let CollisionState;
    (function (CollisionState) {
        CollisionState[CollisionState["Normal"] = 0] = "Normal";
        CollisionState[CollisionState["Inside"] = 1] = "Inside";
        CollisionState[CollisionState["Exit"] = 2] = "Exit";
        CollisionState[CollisionState["Flyback"] = 3] = "Flyback";
    })(CollisionState = MarbleRunSimulatorCore.CollisionState || (MarbleRunSimulatorCore.CollisionState = {}));
    class Ball extends BABYLON.Mesh {
        constructor(positionZero, machine, _materialIndex = 0) {
            super("ball");
            this.positionZero = positionZero;
            this.machine = machine;
            this._materialIndex = _materialIndex;
            this.constructorIndex = 0;
            this.size = 0.016;
            this.velocity = BABYLON.Vector3.Zero();
            this._hasBoostMaterial = false;
            this._boostColor = new BABYLON.Color3(0.9, 0.1, 0.3);
            this._boosting = false;
            this.rotationSpeed = 0;
            this.rotationAxis = BABYLON.Vector3.Right();
            this.surface = Surface.Rail;
            this._showPositionZeroGhost = false;
            this.bumpSurfaceIsRail = true;
            this.flyBackProgress = 0;
            this.flyBackDuration = 1;
            this.animatePosition = Mummu.AnimationFactory.EmptyVector3Callback;
            this._selected = false;
            this._hovered = false;
            this.memCount = 2;
            this._lastWires = [];
            this._lastWireIndexes = [];
            this._pouet = 0;
            this.averageWithOptim = 0;
            this.averageNoOptim = 0;
            this.optimCount = 0;
            this.totalCount = 0;
            this._timer = 0;
            this.strReaction = 0;
            this.lastPosition = BABYLON.Vector3.Zero();
            this.visibleVelocity = BABYLON.Vector3.Zero();
            this.collisionState = CollisionState.Normal;
            this.recordedPositions = [];
            this.rotationQuaternion = BABYLON.Quaternion.Identity();
            this.constructorIndex = Ball.ConstructorIndex++;
            this.marbleChocSound = new BABYLON.Sound("marble-choc-sound", "./lib/marble-run-simulator-core/datas/sounds/marble-choc.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.railBumpSound = new BABYLON.Sound("rail-bump-sound", "./lib/marble-run-simulator-core/datas/sounds/rail-bump.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.marbleLoopSound = new BABYLON.Sound("marble-loop-sound", "./lib/marble-run-simulator-core/datas/sounds/marble-loop-2.wav", this.getScene(), undefined, { loop: true, autoplay: false, volume: 0 });
            this.marbleBowlLoopSound = new BABYLON.Sound("marble-bowl-loop-sound", "./lib/marble-run-simulator-core/datas/sounds/marble-bowl-loop.wav", this.getScene(), undefined, { loop: true, autoplay: false, volume: 0 });
            this.marbleInsideSound = new BABYLON.Sound("marble-bowl-inside-sound", "./lib/marble-run-simulator-core/datas/sounds/ball_roll_wood_noloop.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.marbleInsideSound.setVolume(0.2);
            this.animatePosition = Mummu.AnimationFactory.CreateVector3(this, this, "position");
        }
        get game() {
            return this.machine.game;
        }
        get radius() {
            return this.size * 0.5;
        }
        get volume() {
            return (4 / 3) * Math.PI * Math.pow(this.size * 0.5, 3);
        }
        get mass() {
            return 7850 * this.volume;
        }
        get sectionArea() {
            return Math.PI * this.radius * this.radius;
        }
        get boosting() {
            return this._boosting;
        }
        set boosting(v) {
            if (this._boosting != v) {
                this._boosting = v;
                if (this._boosting && !this._hasBoostMaterial) {
                    this.useBoostingMaterial();
                }
            }
        }
        useBoostingMaterial() {
            if (!this._hasBoostMaterial) {
                this._hasBoostMaterial = true;
                this.material = this.game.materials.getParkourBallMaterial(this.machine.materialQ);
                if (this.material instanceof BABYLON.PBRMetallicRoughnessMaterial) {
                    this._baseColor = this.material.baseColor.clone();
                }
                else if (this.material instanceof BABYLON.StandardMaterial) {
                    this._baseColor = this.material.diffuseColor.clone();
                }
            }
            if (!this._boostAnimation) {
                this._boostAnimation = new MarbleRunSimulatorCore.BallBoostAnimation(this);
            }
            if (!this._boostAnimation.instantiated) {
                this._boostAnimation.instantiate();
            }
        }
        unuseBoostingMaterial() {
            this._hasBoostMaterial = false;
            if (this._boostAnimation.instantiated) {
                this._boostAnimation.uninstantiate();
            }
            this.material = this.game.materials.getBallMaterial(this.materialIndex, this.machine.materialQ);
        }
        get showPositionZeroGhost() {
            return this._showPositionZeroGhost;
        }
        setShowPositionZeroGhost(v) {
            this._showPositionZeroGhost = v;
            if (this.positionZeroGhost) {
                this.positionZeroGhost.isVisible = v;
            }
        }
        get materialIndex() {
            return this._materialIndex;
        }
        set materialIndex(v) {
            this._materialIndex = v;
            this.material = this.game.materials.getBallMaterial(this.materialIndex, this.machine.materialQ);
        }
        setPositionZero(p) {
            this.positionZero.copyFrom(p);
            this.positionZero.x = Math.round(this.positionZero.x * 1000) / 1000;
            this.positionZero.y = Math.round(this.positionZero.y * 1000) / 1000;
            this.positionZero.z = Math.round(this.positionZero.z * 1000) / 1000;
            if (this.positionZeroGhost) {
                this.positionZeroGhost.position.copyFrom(this.positionZero);
            }
        }
        get k() {
            return -Math.round(this.positionZero.z / MarbleRunSimulatorCore.tileDepth);
        }
        set k(v) {
            this.positionZero.z = -Math.round(v) * MarbleRunSimulatorCore.tileDepth;
            this.positionZeroGhost.position.copyFrom(this.positionZero);
        }
        select() {
            this._selected = true;
            this.updateSelectorMeshVisibility();
        }
        unselect() {
            this._selected = false;
            this.updateSelectorMeshVisibility();
        }
        hover() {
            this._hovered = true;
            this.updateSelectorMeshVisibility();
        }
        anhover() {
            this._hovered = false;
            this.updateSelectorMeshVisibility();
        }
        updateSelectorMeshVisibility() {
            this.positionZeroGhost.isVisible = this._showPositionZeroGhost;
            if (this.machine.playing) {
                this.renderOutline = false;
                this.positionZeroGhost.visibility = 0.5;
                this.positionZeroGhost.renderOutline = true;
                this.positionZeroGhost.outlineWidth = 0.0005;
                this.positionZeroGhost.outlineColor.copyFromFloats(0.6, 0.6, 0.6);
                if (this._hovered) {
                    this.positionZeroGhost.outlineColor.copyFromFloats(0.8, 0.8, 0.8);
                }
                if (this._selected) {
                    this.positionZeroGhost.outlineColor.copyFromFloats(1, 1, 1);
                }
            }
            else {
                this.positionZeroGhost.visibility = 0;
                this.renderOutline = true;
                this.outlineWidth = 0.0005;
                this.outlineColor.copyFromFloats(0.6, 0.6, 0.6);
                if (this._hovered) {
                    this.outlineColor.copyFromFloats(0.8, 0.8, 0.8);
                }
                if (this._selected) {
                    this.outlineColor.copyFromFloats(1, 1, 1);
                }
            }
        }
        setIsVisible(isVisible) {
            this.isVisible = isVisible;
            this.getChildMeshes().forEach((m) => {
                m.isVisible = isVisible;
            });
        }
        async instantiate(hotReload) {
            this.marbleLoopSound.setVolume(0);
            this.marbleBowlLoopSound.setVolume(0);
            let segmentsCount = 6;
            if (this.machine.geometryQ === MarbleRunSimulatorCore.GeometryQuality.Medium) {
                segmentsCount = 10;
            }
            else if (this.machine.geometryQ === MarbleRunSimulatorCore.GeometryQuality.High) {
                segmentsCount = 14;
            }
            let data = BABYLON.CreateSphereVertexData({ diameter: this.size, segments: segmentsCount });
            let uvs = data.uvs;
            for (let i = 0; i < uvs.length / 2; i++) {
                uvs[2 * i] *= -2;
            }
            data.applyToMesh(this);
            this._hasBoostMaterial = false;
            this.material = this.game.materials.getBallMaterial(this.materialIndex, this.machine.materialQ);
            if (this.positionZeroGhost) {
                this.positionZeroGhost.dispose();
            }
            this.positionZeroGhost = new BallGhost(this);
            data.applyToMesh(this.positionZeroGhost);
            this.positionZeroGhost.material = this.material;
            this.positionZeroGhost.position.copyFrom(this.positionZero);
            this.positionZeroGhost.isVisible = this._showPositionZeroGhost;
            this.updateSelectorMeshVisibility();
            if (!hotReload) {
                this.reset();
            }
        }
        dispose(doNotRecurse, disposeMaterialAndTextures) {
            super.dispose(doNotRecurse, disposeMaterialAndTextures);
            if (this._boostAnimation) {
                this._boostAnimation.dispose();
            }
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
        reset() {
            if (this.rotationQuaternion) {
                this.rotationQuaternion.copyFromFloats(0, 0, 0, 1);
            }
            this.boosting = false;
            if (this._hasBoostMaterial && this.material instanceof BABYLON.PBRMetallicRoughnessMaterial) {
                this.material.baseColor.copyFrom(this._baseColor);
            }
            this.velocity.copyFromFloats(0, 0, 0);
            this._timer = 0;
            this.collisionState = CollisionState.Normal;
            this.marbleLoopSound.setVolume(0, 0.1);
            this.marbleBowlLoopSound.setVolume(0, 0.1);
            this.animatePosition(this.positionZero.add(this.machine.root.position), 0);
        }
        getLastIndex(wire) {
            for (let i = 0; i < this.memCount; i++) {
                if (this._lastWires[i] === wire) {
                    return this._lastWireIndexes[i];
                }
            }
            return -1;
        }
        setLastHit(wire, index) {
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
        updateMaterial(rawDT) {
            if (this._hasBoostMaterial) {
                let materialColor;
                if (this.material instanceof BABYLON.PBRMetallicRoughnessMaterial) {
                    materialColor = this.material.baseColor;
                }
                else if (this.material instanceof BABYLON.StandardMaterial) {
                    materialColor = this.material.diffuseColor;
                }
                if (materialColor) {
                    let targetColor = this._baseColor;
                    if (this.boosting) {
                        targetColor = this._boostColor;
                    }
                    let f = Nabu.Easing.smoothNSec(1 / rawDT, 0.3);
                    BABYLON.Color3.LerpToRef(materialColor, targetColor, 1 - f, materialColor);
                }
            }
            if (this._boostAnimation) {
                this._boostAnimation.shown = this.boosting;
                this._boostAnimation.update(rawDT);
            }
        }
        update(dt) {
            if (this.game.DEBUG_MODE && (this.recordedPositions.length === 0 || BABYLON.Vector3.Distance(this.position, this.recordedPositions[this.recordedPositions.length - 1]) > 0.01 && this.recordedPositions.length < 1000)) {
                this.recordedPositions.push(this.position.clone());
            }
            let sign = Math.sign(this.velocity.y);
            if (this.machine.hasExitHole && this.collisionState === CollisionState.Normal && this.position.y < this.machine.baseMeshMinY - 0.15) {
                this.collisionState = CollisionState.Inside;
                this.marbleInsideSound.setPlaybackRate(this.game.currentTimeFactor);
                this.marbleInsideSound.play();
                let tmpDestination = this.machine.exitHoleOut.absolutePosition.clone();
                tmpDestination.z += 0.05;
                this.animatePosition(tmpDestination, 2.7 / this.game.currentTimeFactor - 0.1).then(() => {
                    this.animatePosition(this.machine.exitHoleOut.absolutePosition, 0.1).then(() => {
                        this.collisionState = CollisionState.Exit;
                        this.velocity.copyFromFloats(0, 0, -0.2);
                    });
                });
            }
            this._timer += dt;
            this._timer = Math.min(this._timer, 1);
            let rawDT = this.getScene().deltaTime / 1000;
            if (isFinite(rawDT)) {
                this.updateMaterial(rawDT);
            }
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
                let collisionableParts;
                if (this.collisionState === CollisionState.Normal) {
                    collisionableParts = this.machine.parts;
                }
                if (this.machine.hasExitHole && this.collisionState === CollisionState.Exit) {
                    collisionableParts = [this.machine.exitShooter, this.machine.exitTrack];
                }
                if (collisionableParts) {
                    collisionableParts.forEach((part) => {
                        if (Mummu.SphereAABBCheck(this.position, this.radius, part.AABBMin.x - this.radius, part.AABBMax.x + this.radius, part.AABBMin.y - this.radius, part.AABBMax.y + this.radius, part.AABBMin.z - this.radius, part.AABBMax.z + this.radius)) {
                            part.allWires.forEach((wire) => {
                                let index = this.getLastIndex(wire);
                                let col;
                                let f = Nabu.MinMax(this.velocity.lengthSquared(), 0, 1);
                                let range = Math.round(f * 32 + (1 - f) * 2);
                                col = Mummu.SphereWireIntersection(this.position, this.radius, wire.absolutePath, wire.size * 0.5, !(part instanceof MarbleRunSimulatorCore.Spiral || part instanceof MarbleRunSimulatorCore.SpiralUTurn), index, range);
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
                                }
                            });
                            part.tracks.forEach(track => {
                                if (track instanceof MarbleRunSimulatorCore.PipeTrack || track instanceof MarbleRunSimulatorCore.WoodTrack) {
                                    let col;
                                    let r = 0.011;
                                    if (track instanceof MarbleRunSimulatorCore.WoodTrack) {
                                        r = track.tubeRadius;
                                    }
                                    col = Mummu.SphereInTubeIntersection(this.position, this.radius, track.tubePath, r);
                                    if (col.hit) {
                                        if (track instanceof MarbleRunSimulatorCore.WoodTrack && col.normal.y < -0.1) {
                                        }
                                        else {
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
                                            this.surface = Surface.Bowl;
                                        }
                                    }
                                }
                            });
                            part.decors.forEach(decor => {
                                decor.onBallCollideAABB(this);
                            });
                            if (part instanceof MarbleRunSimulatorCore.GravityWell) {
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
                            if (part instanceof MarbleRunSimulatorCore.Stairway) {
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
                                        if (part.r % 2 === 0) {
                                            this.position.z = box.absolutePosition.z;
                                            this.velocity.z = 0;
                                        }
                                        else {
                                            this.position.x = box.absolutePosition.x;
                                            this.velocity.x = 0;
                                        }
                                        this.bumpSurfaceIsRail = false;
                                    }
                                });
                            }
                            if (part instanceof MarbleRunSimulatorCore.Shooter && part.hasCollidingKicker) {
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
                            if (part instanceof MarbleRunSimulatorCore.Shooter) {
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
                            if (part instanceof MarbleRunSimulatorCore.Controller) {
                                let col = Mummu.SphereMeshIntersection(this.position, this.radius, part.pivotControllerCollider);
                                if (col.hit) {
                                    // Move away from collision
                                    forcedDisplacement.addInPlace(col.normal.scale(col.depth));
                                    if (this.velocity.length() > 0.5) {
                                        this.velocity.scaleInPlace(0.9);
                                    }
                                }
                            }
                            if (part instanceof MarbleRunSimulatorCore.Spawner) {
                                let col = Mummu.SphereMeshIntersection(this.position, this.radius, part.pivotSpawnerCollider);
                                if (col.hit) {
                                    // Move away from collision
                                    forcedDisplacement.addInPlace(col.normal.scale(col.depth));
                                    if (this.velocity.length() > 0.5) {
                                        this.velocity.scaleInPlace(0.9);
                                    }
                                }
                            }
                            if (part instanceof MarbleRunSimulatorCore.Screen) {
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
                    if (this.position.x - this.radius < this.machine.baseMeshMinX + this.machine.root.position.x - this.machine.margin + 0.015) {
                        this.velocity.x = Math.abs(this.velocity.x) * 0.5;
                        this.position.x = this.machine.baseMeshMinX + this.machine.root.position.x - this.machine.margin + 0.015 + this.radius;
                    }
                    if (this.position.x + this.radius > this.machine.baseMeshMaxX + this.machine.root.position.x + this.machine.margin - 0.015) {
                        this.velocity.x = -Math.abs(this.velocity.x) * 0.5;
                        this.position.x = this.machine.baseMeshMaxX + this.machine.root.position.x + this.machine.margin - 0.015 - this.radius;
                    }
                    if (this.position.z - this.radius < this.machine.baseMeshMinZ + this.machine.root.position.z - this.machine.margin + 0.015) {
                        this.velocity.z = Math.abs(this.velocity.z) * 0.5;
                        this.position.z = this.machine.baseMeshMinZ + this.machine.root.position.z - this.machine.margin + 0.015 + this.radius;
                    }
                    if (this.position.z + this.radius > this.machine.baseMeshMaxZ + this.machine.root.position.z + this.machine.margin - 0.015) {
                        this.velocity.z = -Math.abs(this.velocity.z) * 0.5;
                        this.position.z = this.machine.baseMeshMaxZ + this.machine.root.position.z + this.machine.margin - 0.015 - this.radius;
                    }
                    let colExitInHole;
                    if (this.machine.hasExitHole) {
                        colExitInHole = Mummu.SphereLatheIntersection(this.position, this.radius, this.machine.exitHoleIn.absolutePosition, this.machine.exitHolePath);
                    }
                    if (colExitInHole && colExitInHole.hit) {
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
                        let floorCollide = true;
                        if (this.machine.hasExitHole) {
                            let dx = this.position.x - this.machine.exitHoleIn.absolutePosition.x;
                            let dy = this.position.z - this.machine.exitHoleIn.absolutePosition.z;
                            let sqrDistToExitHoleAxis = dx * dx + dy * dy;
                            if (sqrDistToExitHoleAxis < 0.01835 * 0.01835) {
                                floorCollide = false;
                            }
                        }
                        if (floorCollide) {
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
                                if (this.machine.hasExitHole) {
                                    weight.copyFromFloats(-0.01, -1, -0.01).normalize().scaleInPlace(9 * m);
                                }
                                else {
                                    weight.copyFromFloats(0, -1, 0).normalize().scaleInPlace(9 * m);
                                }
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
                    let acceleration = weight;
                    if (this.boosting) {
                        /*
                        let boost = BABYLON.Vector3.Right();
                        if (this.velocity.lengthSquared() > 0) {
                            boost.copyFrom(this.velocity).normalize().scaleInPlace(0.02);
                        }
                        acceleration.addInPlace(boost);
                        */
                        acceleration.scaleInPlace(2.5);
                    }
                    acceleration.addInPlace(reactions);
                    acceleration.addInPlace(friction);
                    acceleration.scaleInPlace(1 / m);
                    this.velocity.addInPlace(acceleration.scale(physicDT));
                    this.position.addInPlace(this.velocity.scale(physicDT));
                    if (reactions.length() > 0) {
                        this.rotationAxis.scaleInPlace(0.2);
                        this.rotationAxis.addInPlace(BABYLON.Vector3.Cross(reactions, this.visibleVelocity).normalize().scaleInPlace(0.8));
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
            let angle = this.rotationSpeed * 2 * Math.PI * dt;
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
                if (!this.marbleLoopSound.isPlaying) {
                    this.marbleLoopSound.play();
                }
                this.marbleBowlLoopSound.setVolume(0, 0.5);
            }
            else if (this.surface === Surface.Bowl) {
                this.marbleBowlLoopSound.setPlaybackRate(this.game.currentTimeFactor);
                this.marbleBowlLoopSound.setVolume(8 * this.strReaction * f * this.game.mainVolume, 0.1);
                if (!this.marbleBowlLoopSound.isPlaying) {
                    this.marbleBowlLoopSound.play();
                }
                this.marbleLoopSound.setVolume(0, 0.5);
            }
            let sign2 = Math.sign(this.velocity.y);
            if (sign != sign2 && this.debugNextYFlip) {
                this.debugNextYFlip();
                this.debugNextYFlip = undefined;
            }
        }
    }
    Ball.ConstructorIndex = 0;
    MarbleRunSimulatorCore.Ball = Ball;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class BallBoostAnimation extends BABYLON.Mesh {
        constructor(ball) {
            super("ball-boost-animation");
            this.ball = ball;
            this._duration = 1.3;
            this._timer = 0;
            this.shown = false;
            this.rings = [];
        }
        get instantiated() {
            return this.rings && this.rings.length > 0;
        }
        instantiate() {
            if (!this.instantiated) {
                for (let i = 0; i < 4; i++) {
                    //this.rings[i] = BABYLON.MeshBuilder.CreateCylinder("ring-" + i.toFixed(0), { height: 0.0015, diameter: 0.02, tessellation: 12 });
                    this.rings[i] = BABYLON.MeshBuilder.CreateTorus("ring-" + i.toFixed(0), { diameter: 0.017, tessellation: 12, thickness: 0.002 });
                    this.rings[i].material = this.ball.game.materials.ballAnimationMaterial;
                    this.rings[i].visibility = 0;
                    this.rings[i].parent = this;
                }
            }
        }
        uninstantiate() {
            for (let i = 0; i < this.rings.length; i++) {
                this.rings[i].dispose();
            }
            this.rings = [];
        }
        update(rawDT) {
            this._timer += rawDT;
            while (this._timer > this._duration) {
                this._timer -= this._duration;
            }
            let targetAlpha = this.shown ? 1 : 0;
            let f = Nabu.Easing.smoothNSec(1 / rawDT, 0.3);
            for (let i = 0; i < this.rings.length; i++) {
                this.rings[i].visibility = this.rings[i].visibility * f + targetAlpha * (1 - f);
            }
            this.position.copyFrom(this.ball.position);
            for (let i = 0; i < this.rings.length; i++) {
                let f = this._timer / this._duration + i / this.rings.length;
                while (f > 1) {
                    f -= 1;
                }
                this.rings[i].position.y = -this.ball.radius - 0.02 + 0.02 * f;
                let size = 1;
                if (f <= 0.9) {
                    size = f / 0.9;
                }
                else {
                    size = 1 - (f - 0.9) / 0.1;
                }
                this.rings[i].scaling.copyFromFloats(size, size, size);
            }
        }
    }
    MarbleRunSimulatorCore.BallBoostAnimation = BallBoostAnimation;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    let MaterialType;
    (function (MaterialType) {
        MaterialType[MaterialType["Plastic"] = 0] = "Plastic";
        MaterialType[MaterialType["Metal"] = 1] = "Metal";
    })(MaterialType = MarbleRunSimulatorCore.MaterialType || (MarbleRunSimulatorCore.MaterialType = {}));
    let BallMaterialType;
    (function (BallMaterialType) {
        BallMaterialType[BallMaterialType["Metal"] = 0] = "Metal";
        BallMaterialType[BallMaterialType["Logo"] = 1] = "Logo";
    })(BallMaterialType = MarbleRunSimulatorCore.BallMaterialType || (MarbleRunSimulatorCore.BallMaterialType = {}));
    class MainMaterials {
        constructor(game) {
            this.game = game;
            this._materialsPBR = [];
            this._materialsSTD = [];
            this._ballMaterialsPBR = [];
            this._ballMaterialsSTD = [];
            this.baseMaterialToBallMaterialTable = [
                { baseIndex: 0, ballIndex: 0 },
                { baseIndex: 1, ballIndex: 1 },
                { baseIndex: 15, ballIndex: 9 },
                { baseIndex: 3, ballIndex: 2 },
                { baseIndex: 4, ballIndex: 3 },
                { baseIndex: 5, ballIndex: 4 },
                { baseIndex: 2, ballIndex: 11 },
            ];
            this._wallpapers = [];
            let envTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./lib/marble-run-simulator-core/datas/environment/environmentSpecular.env", this.game.scene);
            this.handleMaterial = new BABYLON.StandardMaterial("handle-material");
            this.handleMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.handleMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.handleMaterial.alpha = 1;
            this.ghostMaterial = new BABYLON.StandardMaterial("ghost-material");
            this.ghostMaterial.diffuseColor.copyFromFloats(0.8, 0.8, 1);
            this.ghostMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.ghostMaterial.alpha = 1;
            this.gridMaterial = new BABYLON.StandardMaterial("grid-material");
            this.gridMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.gridMaterial.specularColor.copyFromFloats(0, 0, 0);
            //this.gridMaterial.alpha = this.game.config.getValue("gridOpacity");
            this.ballAnimationMaterial = new BABYLON.StandardMaterial("ball-animation-material");
            this.ballAnimationMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.ballAnimationMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.ballAnimationMaterial.emissiveColor = new BABYLON.Color3(0.9, 0.1, 0.3);
            this.ballAnimationMaterial.alpha = 0.5;
            this.cyanMaterial = new BABYLON.StandardMaterial("cyan-material");
            this.cyanMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.cyanMaterial.emissiveColor.copyFromFloats(0, 1, 1);
            this.cyanMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.whiteAutolitMaterial = new BABYLON.StandardMaterial("white-autolit-material");
            this.whiteAutolitMaterial.diffuseColor = BABYLON.Color3.FromHexString("#baccc8");
            this.whiteAutolitMaterial.emissiveColor = BABYLON.Color3.FromHexString("#baccc8").scaleInPlace(0.5);
            this.whiteAutolitMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.whiteFullLitMaterial = new BABYLON.StandardMaterial("white-autolit-material");
            this.whiteFullLitMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.whiteFullLitMaterial.emissiveColor.copyFromFloats(1, 1, 1);
            this.whiteFullLitMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.steelFullLitMaterial = new BABYLON.StandardMaterial("steel-fulllit-material");
            this.steelFullLitMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.6, 0.7);
            this.steelFullLitMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.6, 0.7);
            this.steelFullLitMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.copperFullLitMaterial = new BABYLON.StandardMaterial("copper-fulllit-material");
            this.copperFullLitMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.6, 0.5);
            this.copperFullLitMaterial.emissiveColor = new BABYLON.Color3(0.7, 0.6, 0.5);
            this.copperFullLitMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.selectorFullLitLightBlueMaterial = new BABYLON.StandardMaterial("light-blue-autolit-material");
            this.selectorFullLitLightBlueMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.selectorFullLitLightBlueMaterial.emissiveColor = BABYLON.Color3.FromHexString("#392696");
            this.selectorFullLitLightBlueMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.selectorFullLitBlueMaterial = new BABYLON.StandardMaterial("blue-autolit-material");
            this.selectorFullLitBlueMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.selectorFullLitBlueMaterial.emissiveColor = BABYLON.Color3.FromHexString("#264b96");
            this.selectorFullLitBlueMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.selectorFullLitGreenMaterial = new BABYLON.StandardMaterial("green-autolit-material");
            this.selectorFullLitGreenMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.selectorFullLitGreenMaterial.emissiveColor = BABYLON.Color3.FromHexString("#268396");
            this.selectorFullLitGreenMaterial.specularColor.copyFromFloats(0, 0, 0);
            this._generateMaterials(envTexture);
            let plasticIndigo = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticIndigo.baseColor = BABYLON.Color3.FromHexString("#004777");
            plasticIndigo.metallic = 0;
            plasticIndigo.roughness = 0.9;
            plasticIndigo.environmentTexture = envTexture;
            let plasticRed = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticRed.baseColor = BABYLON.Color3.FromHexString("#A30000");
            plasticRed.metallic = 0;
            plasticRed.roughness = 0.9;
            plasticRed.environmentTexture = envTexture;
            let plasticOrange = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticOrange.baseColor = BABYLON.Color3.FromHexString("#FF7700");
            plasticOrange.metallic = 0;
            plasticOrange.roughness = 0.9;
            plasticOrange.environmentTexture = envTexture;
            let plasticYellow = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticYellow.baseColor = BABYLON.Color3.FromHexString("#EFD28D");
            plasticYellow.metallic = 0;
            plasticYellow.roughness = 0.9;
            plasticYellow.environmentTexture = envTexture;
            let plasticGreen = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticGreen.baseColor = BABYLON.Color3.FromHexString("#00AFB5");
            plasticGreen.metallic = 0;
            plasticGreen.roughness = 0.9;
            plasticGreen.environmentTexture = envTexture;
            this.plasticWhite = new BABYLON.StandardMaterial("plastic-black", this.game.scene);
            this.plasticWhite.diffuseColor = BABYLON.Color3.FromHexString("#FFFFFF");
            this.plasticWhite.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.plasticWhite.emissiveColor.copyFromFloats(0.3, 0.3, 0.3);
            this.velvetMaterial = new BABYLON.StandardMaterial("velvet-material");
            this.velvetMaterial.diffuseColor.copyFromFloats(0.75, 0.75, 0.75);
            this.velvetMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/velvet.jpg");
            this.velvetMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.floorMaterial = new BABYLON.StandardMaterial("velvet-material");
            this.floorMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/floor.png");
            this.floorMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.logoMaterial = new BABYLON.StandardMaterial("logo-material");
            this.logoMaterial.diffuseColor.copyFromFloats(1, 1, 1);
            this.logoMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/logo-white-no-bg.png");
            this.logoMaterial.diffuseTexture.hasAlpha = true;
            this.logoMaterial.useAlphaFromDiffuseTexture = true;
            this.logoMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.logoMaterial.alpha = 0.3;
            this.baseAxisMaterial = new BABYLON.StandardMaterial("logo-material");
            this.baseAxisMaterial.diffuseColor.copyFromFloats(1, 1, 1);
            this.baseAxisMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/axis.png");
            this.baseAxisMaterial.diffuseTexture.hasAlpha = true;
            this.baseAxisMaterial.useAlphaFromDiffuseTexture = true;
            this.baseAxisMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.whiteMaterial = new BABYLON.StandardMaterial("white-material");
            this.whiteMaterial.diffuseColor.copyFromFloats(0.9, 0.95, 1).scaleInPlace(0.9);
            this.whiteMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.paintingLight = new BABYLON.StandardMaterial("autolit-material");
            this.paintingLight.diffuseColor.copyFromFloats(1, 1, 1);
            this.paintingLight.emissiveTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/painting-light.png");
            this.paintingLight.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.wallShadow = new BABYLON.StandardMaterial("autolit-material");
            this.wallShadow.ambientTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wall-shadow.png");
            this.wallShadow.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.wallShadow.emissiveColor.copyFromFloats(0.2, 0.2, 0.2);
            this.slice9Cutoff = new BABYLON.StandardMaterial("9-slice-cutoff-material");
            this.slice9Cutoff.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/9-slice-rounded.png");
            this.slice9Cutoff.diffuseTexture.hasAlpha = true;
            this.slice9Cutoff.useAlphaFromDiffuseTexture = true;
            this.slice9Cutoff.specularColor.copyFromFloats(0, 0, 0);
            this.slice9Cutoff.emissiveColor.copyFromFloats(1, 1, 1);
            this.slice9Cutoff.transparencyMode = BABYLON.Material.MATERIAL_ALPHATEST;
            this.groundMaterial = new BABYLON.StandardMaterial("ground-material");
            this.groundMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/concrete.png");
            this.groundMaterial.diffuseColor = BABYLON.Color3.FromHexString("#3f4c52");
            this.groundMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.whiteGroundMaterial = new BABYLON.StandardMaterial("ground-material");
            this.whiteGroundMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/concrete.png");
            this.whiteGroundMaterial.diffuseColor = BABYLON.Color3.FromHexString("#ffffff");
            this.whiteGroundMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            let cableMaterial = new BABYLON.StandardMaterial("cable-material");
            cableMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/cable.png");
            cableMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.6, 0.7).scale(0.75);
            cableMaterial.specularColor = new BABYLON.Color3(1, 1, 1).scale(0.5);
            cableMaterial.emissiveColor = cableMaterial.diffuseColor.scale(0.5);
            cableMaterial.roughness = 0.15;
            cableMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            let cableMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("steel-pbr", this.game.scene);
            cableMaterialPBR.baseColor = new BABYLON.Color3(0.5, 0.75, 1.0);
            cableMaterialPBR.metallic = 0.8;
            cableMaterialPBR.roughness = 0.4;
            cableMaterialPBR.lightmapTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/cable.png");
            cableMaterialPBR.environmentTexture = envTexture;
            this.cableMaterial = cableMaterial;
            let chainMaterial = new BABYLON.StandardMaterial("cable-material");
            chainMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/chain.png");
            chainMaterial.diffuseColor.copyFromFloats(1, 1, 1);
            chainMaterial.specularColor = new BABYLON.Color3(1, 1, 1).scale(0.5);
            chainMaterial.emissiveColor = chainMaterial.diffuseColor.scale(0.5);
            chainMaterial.roughness = 0.15;
            chainMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.chainMaterial = chainMaterial;
            /*
            let makeMetalBallMaterial = (name: string, textureName: string) => {
                let ballMaterial = new BABYLON.PBRMetallicRoughnessMaterial(name, this.game.scene);
                ballMaterial.metallic = 1;
                ballMaterial.roughness = 0.15;
                ballMaterial.environmentTexture = envTexture;
                ballMaterial.baseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/" + textureName, undefined, undefined, false);

                return ballMaterial;
            }
            */
            let boneMaterial = new BABYLON.PBRMetallicRoughnessMaterial("bone-material");
            boneMaterial.baseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/bone_2.png");
            //boneMaterial.normalTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/bone_nm.png");
            boneMaterial.roughness = 0.9;
            boneMaterial.environmentTexture = envTexture;
            this.bone = boneMaterial;
            let makeBrandedBallMaterialSTD = (name, textureName) => {
                let ballMaterial = new BABYLON.StandardMaterial(name, this.game.scene);
                ballMaterial.specularColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                ballMaterial.roughness = 0.3;
                ballMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/" + textureName, undefined, undefined, false);
                ballMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
                return ballMaterial;
            };
            let makeBrandedBallMaterialPBR = (name, textureName) => {
                let ballMaterial = new BABYLON.PBRMetallicRoughnessMaterial(name, this.game.scene);
                ballMaterial.baseColor = BABYLON.Color3.FromHexString("#FFFFFF");
                ballMaterial.metallic = 0.7;
                ballMaterial.roughness = 0.3;
                ballMaterial.environmentTexture = envTexture;
                ballMaterial.baseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/" + textureName, undefined, undefined, false);
                return ballMaterial;
            };
            this._ballMaterialsPBR = [
                this._materialsPBR[0],
                this._materialsPBR[1],
                makeBrandedBallMaterialPBR("square-red", "ball-square-red.png"),
                makeBrandedBallMaterialPBR("circle-green", "ball-circle-green.png"),
                makeBrandedBallMaterialPBR("star-blue", "ball-star-blue.png"),
                makeBrandedBallMaterialPBR("tiaratum", "ball-tiaratum.png"),
                makeBrandedBallMaterialPBR("html5", "ball-html5.png"),
                makeBrandedBallMaterialPBR("tiaratum", "ball-bjs.png"),
                makeBrandedBallMaterialPBR("poki", "ball-poki.png"),
                this._materialsPBR[15],
                this._materialsPBR[17],
                this._materialsPBR[2],
                this._materialsPBR[3],
                this._materialsPBR[16],
                this._materialsPBR[4],
                this._materialsPBR[5]
            ];
            this._ballMaterialsSTD = [
                this._materialsSTD[0],
                this._materialsSTD[1],
                makeBrandedBallMaterialSTD("square-red", "ball-square-red.png"),
                makeBrandedBallMaterialSTD("circle-green", "ball-circle-green.png"),
                makeBrandedBallMaterialSTD("star-blue", "ball-star-blue.png"),
                makeBrandedBallMaterialSTD("tiaratum", "ball-tiaratum.png"),
                makeBrandedBallMaterialSTD("html5", "ball-html5.png"),
                makeBrandedBallMaterialSTD("tiaratum", "ball-bjs.png"),
                makeBrandedBallMaterialSTD("poki", "ball-poki.png"),
                this._materialsSTD[15],
                this._materialsSTD[17],
                this._materialsSTD[2],
                this._materialsSTD[3],
                this._materialsSTD[16],
                this._materialsSTD[4],
                this._materialsSTD[5]
            ];
            let parkourBallColor = BABYLON.Color3.FromHexString("#0c0c18");
            let parkourBallMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("parkour-ball-pbr", this.game.scene);
            parkourBallMaterialPBR.baseColor = parkourBallColor;
            parkourBallMaterialPBR.baseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/ball-parkour.png", undefined, undefined, false);
            parkourBallMaterialPBR.metallic = 0.75;
            parkourBallMaterialPBR.roughness = 0.25;
            parkourBallMaterialPBR.environmentTexture = envTexture;
            let parkourBallMaterialSTD = new BABYLON.StandardMaterial("parkour-ball-pbr", this.game.scene);
            parkourBallMaterialSTD.diffuseColor = parkourBallColor.scale(4);
            parkourBallMaterialSTD.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/ball-parkour.png", undefined, undefined, false);
            parkourBallMaterialSTD.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            parkourBallMaterialSTD.emissiveColor = parkourBallMaterialSTD.diffuseColor.scale(0.5);
            parkourBallMaterialSTD.roughness = 0.25;
            this._parkourBallMaterialPBR = parkourBallMaterialPBR;
            this._parkourBallMaterialSTD = parkourBallMaterialSTD;
            /*
            this._wallpapers = [];

            let abstractBubblesMaterial = new BABYLON.StandardMaterial("abstract-bubbles-material");
            abstractBubblesMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wallpapers/abstract-bubbles.png");
            abstractBubblesMaterial.ambientTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wall-shadow.png");
            abstractBubblesMaterial.ambientTexture.coordinatesIndex = 1;
            abstractBubblesMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            abstractBubblesMaterial.emissiveColor.copyFromFloats(0.2, 0.2, 0.2);
            this._wallpapers[0] = abstractBubblesMaterial;
            

            let abstractSquaresMaterial = new BABYLON.StandardMaterial("abstract-squares-material");
            abstractSquaresMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wallpapers/abstract-squares.png");
            abstractSquaresMaterial.ambientTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wall-shadow.png");
            abstractSquaresMaterial.ambientTexture.coordinatesIndex = 1;
            abstractSquaresMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            abstractSquaresMaterial.emissiveColor.copyFromFloats(0.2, 0.2, 0.2);
            this._wallpapers[1] = abstractSquaresMaterial;
            */
        }
        getMaterial(colorIndex, materialQ) {
            if (materialQ === MarbleRunSimulatorCore.MaterialQuality.PBR) {
                return this._materialsPBR[colorIndex % this._materialsPBR.length];
            }
            return this._materialsSTD[colorIndex % this._materialsSTD.length];
        }
        getMaterialType(colorIndex) {
            if (colorIndex >= 6 && colorIndex <= 14) {
                return MaterialType.Plastic;
            }
            return MaterialType.Metal;
        }
        getBallMaterialType(colorIndex) {
            if (colorIndex >= 2 && colorIndex <= 8) {
                return BallMaterialType.Logo;
            }
            return BallMaterialType.Metal;
        }
        getMaterialHexBaseColor(colorIndex, materialQ) {
            let material = this.getMaterial(colorIndex, materialQ);
            if (material instanceof BABYLON.StandardMaterial) {
                return material.diffuseColor.toHexString();
            }
            if (material instanceof BABYLON.PBRMetallicRoughnessMaterial) {
                return material.baseColor.toHexString();
            }
            return "#ffffff";
        }
        getBallMaterialHexBaseColor(colorIndex, materialQ) {
            let material = this.getBallMaterial(colorIndex, materialQ);
            if (material instanceof BABYLON.StandardMaterial) {
                return material.diffuseColor.toHexString();
            }
            if (material instanceof BABYLON.PBRMetallicRoughnessMaterial) {
                return material.baseColor.toHexString();
            }
            return "#ffffff";
        }
        get metalMaterialsCount() {
            return Math.min(this._materialsPBR.length, this._materialsSTD.length);
        }
        getBallMaterial(colorIndex, materialQ) {
            if (materialQ === MarbleRunSimulatorCore.MaterialQuality.PBR) {
                return this._ballMaterialsPBR[colorIndex % this._ballMaterialsPBR.length];
            }
            return this._ballMaterialsSTD[colorIndex % this._ballMaterialsSTD.length];
        }
        getParkourBallMaterial(materialQ) {
            if (materialQ === MarbleRunSimulatorCore.MaterialQuality.PBR) {
                return this._parkourBallMaterialPBR;
            }
            return this._parkourBallMaterialSTD;
        }
        get ballMaterialsCount() {
            return Math.min(this._ballMaterialsPBR.length, this._ballMaterialsSTD.length);
        }
        ballMaterialIndexToBaseMaterialIndex(ballMaterialIndex) {
            let e = this.baseMaterialToBallMaterialTable.find(e => { return e.ballIndex === ballMaterialIndex; });
            if (e) {
                return e.baseIndex;
            }
            return 0;
        }
        baseMaterialIndexToBallMaterialIndex(baseMaterialIndex) {
            let e = this.baseMaterialToBallMaterialTable.find(e => { return e.baseIndex === baseMaterialIndex; });
            if (e) {
                return e.ballIndex;
            }
            return 0;
        }
        getWallpaperMaterial(index) {
            return this._wallpapers[index];
        }
        get plasticBlack() {
            return this.getMaterial(6, MarbleRunSimulatorCore.MaterialQuality.Standard);
        }
        _makePlasticPBR(name, color, envTexture) {
            let plastic = new BABYLON.PBRMetallicRoughnessMaterial(name, this.game.scene);
            plastic.baseColor = color;
            plastic.roughness = 1;
            plastic.environmentTexture = envTexture;
            return plastic;
        }
        _makePlasticSTD(name, color) {
            let plastic = new BABYLON.StandardMaterial(name, this.game.scene);
            plastic.diffuseColor = color;
            plastic.emissiveColor = plastic.diffuseColor.scale(0.4).add(new BABYLON.Color3(0.1, 0.1, 0.1));
            plastic.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            return plastic;
        }
        _makeMetalPBR(name, color, envTexture) {
            let metalMaterial = new BABYLON.PBRMetallicRoughnessMaterial(name, this.game.scene);
            metalMaterial.baseColor = color;
            metalMaterial.metallic = 0.75;
            metalMaterial.roughness = 0.25;
            metalMaterial.environmentTexture = envTexture;
            return metalMaterial;
        }
        _makeMetalSTD(name, color) {
            let metalMaterial = new BABYLON.StandardMaterial(name, this.game.scene);
            metalMaterial.diffuseColor = color;
            metalMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            metalMaterial.emissiveColor = metalMaterial.diffuseColor.scale(0.5);
            metalMaterial.roughness = 0.25;
            return metalMaterial;
        }
        _generateMaterials(envTexture) {
            this._materialsPBR = [];
            this._materialsSTD = [];
            let steelMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("steel-pbr", this.game.scene);
            steelMaterialPBR.baseColor = new BABYLON.Color3(0.5, 0.75, 1.0);
            steelMaterialPBR.metallic = 1.0;
            steelMaterialPBR.roughness = 0.15;
            steelMaterialPBR.environmentTexture = envTexture;
            let steelMaterialSTD = new BABYLON.StandardMaterial("steel-std", this.game.scene);
            steelMaterialSTD.diffuseColor = new BABYLON.Color3(0.5, 0.6, 0.7);
            steelMaterialSTD.specularColor = new BABYLON.Color3(1, 1, 1);
            steelMaterialSTD.emissiveColor = steelMaterialSTD.diffuseColor.scale(0.5);
            steelMaterialSTD.roughness = 0.15;
            this._materialsPBR.push(steelMaterialPBR);
            this._materialsSTD.push(steelMaterialSTD);
            let brassMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("brass-pbr", this.game.scene);
            brassMaterialPBR.baseColor = BABYLON.Color3.FromHexString("#B87333");
            brassMaterialPBR.metallic = 0.9;
            brassMaterialPBR.roughness = 0.15;
            brassMaterialPBR.environmentTexture = envTexture;
            let brassMaterialSTD = new BABYLON.StandardMaterial("brass-std", this.game.scene);
            brassMaterialSTD.diffuseColor = BABYLON.Color3.FromHexString("#B87333");
            brassMaterialSTD.specularColor = new BABYLON.Color3(1, 1, 1);
            brassMaterialSTD.emissiveColor = brassMaterialSTD.diffuseColor.scale(0.5);
            brassMaterialSTD.roughness = 0.15;
            this._materialsPBR.push(brassMaterialPBR);
            this._materialsSTD.push(brassMaterialSTD);
            this._materialsPBR.push(this._makeMetalPBR("black-steel-pbr", new BABYLON.Color3(0.05, 0.04, 0.045), envTexture));
            this._materialsSTD.push(this._makeMetalSTD("black-steel-std", new BABYLON.Color3(0.05, 0.04, 0.045)));
            this._materialsPBR.push(this._makeMetalPBR("red-steel-pbr", BABYLON.Color3.FromHexString("#e6261f"), envTexture));
            this._materialsSTD.push(this._makeMetalSTD("red-steel-std", BABYLON.Color3.FromHexString("#e6261f")));
            this._materialsPBR.push(this._makeMetalPBR("green-steel-pbr", BABYLON.Color3.FromHexString("#68D62C"), envTexture));
            this._materialsSTD.push(this._makeMetalSTD("green-steel-std", BABYLON.Color3.FromHexString("#68D62C")));
            this._materialsPBR.push(this._makeMetalPBR("blue-steel-pbr", BABYLON.Color3.FromHexString("#14B8B8"), envTexture));
            this._materialsSTD.push(this._makeMetalSTD("blue-steel-std", BABYLON.Color3.FromHexString("#14B8B8")));
            let plasticBlack = new BABYLON.StandardMaterial("plastic-black", this.game.scene);
            plasticBlack.diffuseColor = BABYLON.Color3.FromHexString("#282a33");
            plasticBlack.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            plasticBlack.emissiveColor.copyFromFloats(0.1, 0.1, 0.1);
            this._materialsPBR.push(plasticBlack);
            this._materialsSTD.push(plasticBlack);
            /*#e6261f,#eb7532,#f7d038,#a3e048,#49da9a,#34bbe6,#4355db,#d23be7*/
            this._materialsPBR.push(this._makePlasticPBR("red-plastic-pbr", BABYLON.Color3.FromHexString("#e6261f"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("red-plastic-std", BABYLON.Color3.FromHexString("#e6261f")));
            this._materialsPBR.push(this._makePlasticPBR("orange-plastic-pbr", BABYLON.Color3.FromHexString("#eb7532"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("orange-plastic-std", BABYLON.Color3.FromHexString("#eb7532")));
            this._materialsPBR.push(this._makePlasticPBR("yellow-plastic-pbr", BABYLON.Color3.FromHexString("#f7d038"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("yellow-plastic-std", BABYLON.Color3.FromHexString("#f7d038")));
            this._materialsPBR.push(this._makePlasticPBR("green-plastic-pbr", BABYLON.Color3.FromHexString("#7de048"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("green-plastic-std", BABYLON.Color3.FromHexString("#7de048")));
            this._materialsPBR.push(this._makePlasticPBR("eucalyptus-plastic-pbr", BABYLON.Color3.FromHexString("#49da9a"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("eucalyptus-plastic-std", BABYLON.Color3.FromHexString("#49da9a")));
            this._materialsPBR.push(this._makePlasticPBR("blue-plastic-pbr", BABYLON.Color3.FromHexString("#34bbe6"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("blue-plastic-std", BABYLON.Color3.FromHexString("#34bbe6")));
            this._materialsPBR.push(this._makePlasticPBR("royal-blue-plastic-pbr", BABYLON.Color3.FromHexString("#4355db"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("royal-blue-plastic-std", BABYLON.Color3.FromHexString("#4355db")));
            this._materialsPBR.push(this._makePlasticPBR("pink-plastic-pbr", BABYLON.Color3.FromHexString("#d23be7"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("pink-plastic-std", BABYLON.Color3.FromHexString("#d23be7")));
            let copperMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("copper-pbr", this.game.scene);
            copperMaterialPBR.baseColor = BABYLON.Color3.FromHexString("#9c3814");
            copperMaterialPBR.metallic = 0.9;
            copperMaterialPBR.roughness = 0.15;
            copperMaterialPBR.environmentTexture = envTexture;
            let copperMaterialSTD = new BABYLON.StandardMaterial("copper-std", this.game.scene);
            copperMaterialSTD.diffuseColor = BABYLON.Color3.FromHexString("#9c3814");
            copperMaterialSTD.specularColor = new BABYLON.Color3(1, 1, 1);
            copperMaterialSTD.emissiveColor = copperMaterialSTD.diffuseColor.scale(0.5);
            copperMaterialSTD.roughness = 0.15;
            this._materialsPBR.push(copperMaterialPBR);
            this._materialsSTD.push(copperMaterialSTD);
            this._materialsPBR.push(this._makeMetalPBR("yellow-steel-pbr", BABYLON.Color3.FromHexString("#f7d038"), envTexture));
            this._materialsSTD.push(this._makeMetalSTD("yellow-steel-std", BABYLON.Color3.FromHexString("#f7d038")));
            this._materialsPBR.push(this._makeMetalPBR("white-steel-pbr", BABYLON.Color3.FromHexString("#FAFFD8"), envTexture));
            this._materialsSTD.push(this._makeMetalSTD("white-steel-std", BABYLON.Color3.FromHexString("#FAFFD8")));
        }
    }
    MarbleRunSimulatorCore.MainMaterials = MainMaterials;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class MiniatureTrack {
        constructor() {
            this.points = [];
            this.dist = Infinity;
        }
    }
    MarbleRunSimulatorCore.MiniatureTrack = MiniatureTrack;
    class MiniatureShape {
        constructor() {
            this.center = BABYLON.Vector3.Zero();
            this.points = [];
            this.dist = Infinity;
            this.fill = true;
        }
        static MakeNGon(c, r, axis, n, fill) {
            let tmp = BABYLON.Axis.X;
            if (Mummu.Angle(axis, tmp) < Math.PI / 100) {
                tmp = BABYLON.Axis.Y;
            }
            tmp = BABYLON.Vector3.Cross(axis, tmp).normalize().scaleInPlace(r);
            let shape = new MiniatureShape();
            shape.points.push(tmp.clone());
            for (let i = 0; i < n - 1; i++) {
                Mummu.RotateInPlace(tmp, axis, 2 * Math.PI / n);
                shape.points.push(tmp.clone());
            }
            shape.points.forEach(pt => {
                pt.addInPlace(c);
                shape.center.addInPlace(pt);
            });
            shape.center.scaleInPlace(1 / shape.points.length);
            shape.fill = fill;
            return shape;
        }
    }
    MarbleRunSimulatorCore.MiniatureShape = MiniatureShape;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Sound {
        constructor(prop) {
            if (prop) {
                if (prop.fileName) {
                    this._audioElement = new Audio(prop.fileName);
                }
                if (this._audioElement) {
                    if (prop.loop) {
                        this._audioElement.loop = prop.loop;
                    }
                }
            }
        }
        get volume() {
            return this._audioElement.volume;
        }
        set volume(v) {
            if (isFinite(v)) {
                this._audioElement.volume = Math.max(Math.min(v, 1), 0);
            }
        }
        play(fromBegin = true) {
            if (this._audioElement) {
                if (fromBegin) {
                    this._audioElement.currentTime = 0;
                }
                try {
                    this._audioElement.play();
                }
                catch (error) {
                    requestAnimationFrame(() => {
                        this._audioElement.play();
                    });
                }
            }
        }
        pause() {
            if (this._audioElement) {
                this._audioElement.pause();
            }
        }
    }
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Tools {
        static V3Dir(angleInDegrees, length = 1) {
            return new BABYLON.Vector3(Math.sin((angleInDegrees / 180) * Math.PI) * length, Math.cos((angleInDegrees / 180) * Math.PI) * length, 0);
        }
        static IsWorldPosAConnexion(worldPos) {
            let dy = Math.abs(worldPos.y - Math.round(worldPos.y / MarbleRunSimulatorCore.tileHeight) * MarbleRunSimulatorCore.tileHeight);
            if (dy > 0.001) {
                return false;
            }
            let dxH = Math.abs(worldPos.x + MarbleRunSimulatorCore.tileSize * 0.5 - Math.round((worldPos.x + MarbleRunSimulatorCore.tileSize * 0.5) / MarbleRunSimulatorCore.tileSize) * MarbleRunSimulatorCore.tileSize);
            let dzV = Math.abs(worldPos.z - Math.round(worldPos.z / MarbleRunSimulatorCore.tileSize) * MarbleRunSimulatorCore.tileSize);
            if (dxH < 0.001 && dzV < 0.001) {
                return true;
            }
            let dxV = Math.abs(worldPos.x - Math.round((worldPos.x) / MarbleRunSimulatorCore.tileSize) * MarbleRunSimulatorCore.tileSize);
            let dzH = Math.abs(worldPos.z + MarbleRunSimulatorCore.tileSize * 0.5 - Math.round((worldPos.z + MarbleRunSimulatorCore.tileSize * 0.5) / MarbleRunSimulatorCore.tileSize) * MarbleRunSimulatorCore.tileSize);
            if (dxV < 0.001 && dzH < 0.001) {
                return true;
            }
            return false;
        }
        static Box9SliceVertexData(min, max, margin) {
            let w = Math.abs(min.x - max.x);
            let h = Math.abs(min.y - max.y);
            let d = Math.abs(min.z - max.z);
            let c = min.add(max).scaleInPlace(0.5);
            let top = Mummu.Create9SliceVertexData({
                width: w,
                height: d,
                margin: margin
            });
            Mummu.RotateAngleAxisVertexDataInPlace(top, Math.PI * 0.5, BABYLON.Axis.X);
            let bottom = Mummu.TriFlipVertexDataInPlace(Mummu.CloneVertexData(top));
            Mummu.TranslateVertexDataInPlace(top, new BABYLON.Vector3(c.x, max.y, c.z));
            Mummu.TranslateVertexDataInPlace(bottom, new BABYLON.Vector3(c.x, min.y, c.z));
            let back = Mummu.Create9SliceVertexData({
                width: w,
                height: h,
                margin: margin
            });
            let front = Mummu.TriFlipVertexDataInPlace(Mummu.CloneVertexData(back));
            Mummu.TranslateVertexDataInPlace(front, new BABYLON.Vector3(c.x, c.y, max.z));
            Mummu.TranslateVertexDataInPlace(back, new BABYLON.Vector3(c.x, c.y, min.z));
            let right = Mummu.Create9SliceVertexData({
                width: d,
                height: h,
                margin: margin
            });
            Mummu.RotateAngleAxisVertexDataInPlace(right, -Math.PI * 0.5, BABYLON.Axis.Y);
            let left = Mummu.TriFlipVertexDataInPlace(Mummu.CloneVertexData(right));
            Mummu.TranslateVertexDataInPlace(right, new BABYLON.Vector3(max.x, c.y, c.z));
            Mummu.TranslateVertexDataInPlace(left, new BABYLON.Vector3(min.x, c.y, c.z));
            let boxData = Mummu.MergeVertexDatas(right, left, top, bottom, front, back);
            let boxDataFlipped = Mummu.TriFlipVertexDataInPlace(Mummu.CloneVertexData(boxData));
            Mummu.ColorizeVertexDataInPlace(boxDataFlipped, new BABYLON.Color3(0.5, 0.5, 0.5));
            boxData = Mummu.MergeVertexDatas(boxData, boxDataFlipped);
            return boxData;
        }
    }
    MarbleRunSimulatorCore.Tools = Tools;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Wire extends BABYLON.Mesh {
        constructor(part) {
            super("wire");
            this.part = part;
            this.path = [];
            this.normals = [];
            this.absolutePath = [];
            this.parent = this.part;
            this.rotationQuaternion = BABYLON.Quaternion.Identity();
        }
        get size() {
            if (isFinite(this.wireSize)) {
                return this.wireSize;
            }
            return this.part.wireSize;
        }
        get radius() {
            return this.size * 0.5;
        }
        show() {
            this.isVisible = true;
            this.getChildMeshes().forEach((child) => {
                child.isVisible = true;
            });
        }
        hide() {
            this.isVisible = false;
            this.getChildMeshes().forEach((child) => {
                child.isVisible = false;
            });
        }
        recomputeAbsolutePath() {
            this.computeWorldMatrix(true);
            this.absolutePath.splice(this.path.length);
            for (let i = 0; i < this.path.length; i++) {
                if (!this.absolutePath[i]) {
                    this.absolutePath[i] = BABYLON.Vector3.Zero();
                }
                BABYLON.Vector3.TransformCoordinatesToRef(this.path[i], this.getWorldMatrix(), this.absolutePath[i]);
            }
        }
        async instantiate(color = 0) {
            let q = this.part.machine.geometryQ;
            while (this.getChildren().length > 0) {
                this.getChildren()[0].dispose();
            }
            let n = 4;
            if (q === 2) {
                n = 6;
            }
            let shape = [];
            for (let i = 0; i < n; i++) {
                let a = (i / n) * 2 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                shape[i] = new BABYLON.Vector3(cosa * this.radius, sina * this.radius, 0);
            }
            if (!Wire.DEBUG_DISPLAY) {
                let path = [...this.path];
                if (q < 2) {
                    path = [];
                    for (let i = 0; i < this.path.length; i++) {
                        if (i % 3 === 0 || i === this.path.length - 1) {
                            path.push(this.path[i]);
                        }
                    }
                }
                if (this.startTipDir) {
                    let d = this.startTipDir
                        .clone()
                        .normalize()
                        .scaleInPlace(-1)
                        .scaleInPlace(this.part.wireGauge * 0.5);
                    Mummu.RotateInPlace(d, this.startTipNormal, -Math.PI / 2);
                    let tipPath = [d.add(this.startTipCenter)];
                    for (let i = 0; i < 8 - 1; i++) {
                        Mummu.RotateInPlace(d, this.startTipNormal, Math.PI / 8);
                        tipPath.push(d.add(this.startTipCenter));
                    }
                    path = [...tipPath, ...path];
                }
                if (this.endTipDir) {
                    let d = this.endTipDir.clone().normalize().scaleInPlace(this.part.wireGauge * 0.5);
                    Mummu.RotateInPlace(d, this.endTipNormal, -Math.PI / 2);
                    let tipPath = [];
                    for (let i = 0; i < 8; i++) {
                        Mummu.RotateInPlace(d, this.endTipNormal, Math.PI / 8);
                        tipPath.push(d.add(this.endTipCenter));
                    }
                    path.push(...tipPath);
                }
                let wire = BABYLON.ExtrudeShape("wire", { shape: shape, path: path, closeShape: true, cap: BABYLON.Mesh.CAP_ALL });
                wire.parent = this;
                wire.material = this.part.game.materials.getMaterial(color, this.part.machine.materialQ);
            }
            if (Wire.DEBUG_DISPLAY) {
                for (let i = 0; i < this.path.length - 1; i++) {
                    let dir = this.path[i].subtract(this.path[i + 1]).normalize();
                    let l = BABYLON.Vector3.Distance(this.path[i + 1], this.path[i]);
                    let wireSection = BABYLON.CreateCapsule("wire-section", { radius: this.size * 0.6, height: l });
                    wireSection.position
                        .copyFrom(this.path[i + 1])
                        .addInPlace(this.path[i])
                        .scaleInPlace(0.5);
                    wireSection.rotationQuaternion = BABYLON.Quaternion.Identity();
                    wireSection.parent = this;
                    Mummu.QuaternionFromYZAxisToRef(dir, BABYLON.Axis.Y, wireSection.rotationQuaternion);
                }
            }
        }
    }
    Wire.DEBUG_DISPLAY = false;
    MarbleRunSimulatorCore.Wire = Wire;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
/// <reference path="../../../babylon.d.ts"/>
/// <reference path="../../../nabu/nabu.d.ts"/>
/// <reference path="../../../mummu/mummu.d.ts"/>
var THE_ORIGIN_OF_TIME_ms;
var IsTouchScreen;
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    function NToHex(n, l = 2) {
        return n.toString(36).padStart(l, "0").substring(0, l);
    }
    MarbleRunSimulatorCore.NToHex = NToHex;
    MarbleRunSimulatorCore.ballOffset = 23328; // it's 36 * 36 * 36 / 2
    MarbleRunSimulatorCore.partOffset = 648; // it's 36 * 36 / 2
    let GraphicQuality;
    (function (GraphicQuality) {
        GraphicQuality[GraphicQuality["Proxy"] = 0] = "Proxy";
        GraphicQuality[GraphicQuality["VeryLow"] = 1] = "VeryLow";
        GraphicQuality[GraphicQuality["Low"] = 2] = "Low";
        GraphicQuality[GraphicQuality["Medium"] = 3] = "Medium";
        GraphicQuality[GraphicQuality["High"] = 4] = "High";
        GraphicQuality[GraphicQuality["VeryHigh"] = 5] = "VeryHigh";
    })(GraphicQuality = MarbleRunSimulatorCore.GraphicQuality || (MarbleRunSimulatorCore.GraphicQuality = {}));
    let GeometryQuality;
    (function (GeometryQuality) {
        GeometryQuality[GeometryQuality["Proxy"] = 0] = "Proxy";
        GeometryQuality[GeometryQuality["Low"] = 1] = "Low";
        GeometryQuality[GeometryQuality["Medium"] = 2] = "Medium";
        GeometryQuality[GeometryQuality["High"] = 3] = "High";
    })(GeometryQuality = MarbleRunSimulatorCore.GeometryQuality || (MarbleRunSimulatorCore.GeometryQuality = {}));
    let MaterialQuality;
    (function (MaterialQuality) {
        MaterialQuality[MaterialQuality["Standard"] = 0] = "Standard";
        MaterialQuality[MaterialQuality["PBR"] = 1] = "PBR";
    })(MaterialQuality = MarbleRunSimulatorCore.MaterialQuality || (MarbleRunSimulatorCore.MaterialQuality = {}));
    // Should be removed
    let GameMode;
    (function (GameMode) {
        GameMode[GameMode["Home"] = 0] = "Home";
        GameMode[GameMode["Page"] = 1] = "Page";
        GameMode[GameMode["Create"] = 2] = "Create";
        GameMode[GameMode["Challenge"] = 3] = "Challenge";
        GameMode[GameMode["Demo"] = 4] = "Demo";
        GameMode[GameMode["GravityControl"] = 5] = "GravityControl";
    })(GameMode = MarbleRunSimulatorCore.GameMode || (MarbleRunSimulatorCore.GameMode = {}));
    class Machine {
        constructor(game) {
            this.game = game;
            this.version = -1;
            this.name = "Unnamed Machine";
            this.author = "Unknown Author";
            this.isChallengeMachine = false;
            this.TEST_USE_BASE_FPS = false; // only for Poki playtest
            this.parts = [];
            this.decors = [];
            this.balls = [];
            this.ready = false;
            this.instantiated = false;
            this.hasBeenOpenedInEditor = false;
            this.minimalAutoQualityFailed = GraphicQuality.VeryHigh + 1;
            this.updatingMachinePartCoordinates = false;
            this.playing = false;
            this.hasExitHole = false;
            this.baseColor = "#ffffff";
            this._roomIndex = 0;
            this.graphicQ = GraphicQuality.Medium;
            this.onPlayCallbacks = new Nabu.UniqueList();
            this._paused = false;
            this.onStopCallbacks = new Nabu.UniqueList();
            this.margin = 0.05;
            this.baseMeshMinX = -this.margin;
            this.baseMeshMaxX = this.margin;
            this.baseMeshMinY = -this.margin;
            this.baseMeshMaxY = this.margin;
            this.baseMeshMinZ = -this.margin;
            this.baseMeshMaxZ = this.margin;
            this.tracksMinX = 0;
            this.tracksMaxX = 0;
            this.tracksMinY = 0;
            this.tracksMaxY = 0;
            this.tracksMinZ = 0;
            this.tracksMaxZ = 0;
            this.requestUpdateBaseMesh = false;
            this.requestUpdateShadow = false;
            this.root = new BABYLON.Mesh("machine-root");
            let material = new BABYLON.StandardMaterial("white-material");
            material.diffuseColor.copyFromFloats(1, 1, 1);
            material.specularColor.copyFromFloats(0.2, 0.2, 0.2);
            material.emissiveColor.copyFromFloats(0.1, 0.1, 0.1);
            this.root.material = material;
            this.name = MachineName.GetRandom();
            this.trackFactory = new MarbleRunSimulatorCore.MachinePartFactory(this);
            this.templateManager = new MarbleRunSimulatorCore.TemplateManager(this);
            this.sleepersMeshProp = { grndAnchors: true, grndAnchorsMaxY: 0.35 };
            if (this.hasExitHole) {
                this.exitShooter = new MarbleRunSimulatorCore.Shooter(this, { i: 0, j: 0, k: 0, h: 3, mirrorX: true, c: [0, 0, 0, 6, 3] });
                this.exitShooter.parent = this.root;
                this.exitShooter.isSelectable = false;
                this.exitShooter.offsetPosition.copyFromFloats(0, 0, -0.007);
                this.exitShooter.sleepersMeshProp = { forceDrawWallAnchors: true, forcedWallAnchorsZ: 0.019 };
                this.exitTrack = new MarbleRunSimulatorCore.Start(this, { i: 0, j: 0, k: 0, mirrorX: true, c: [0] });
                this.exitTrack.parent = this.root;
                this.exitTrack.isSelectable = false;
                this.exitTrack.offsetPosition.copyFromFloats(0, 0, -0.007);
                this.exitTrack.sleepersMeshProp = { forceDrawWallAnchors: true, forcedWallAnchorsZ: 0.019 };
                this.exitHolePath = [new BABYLON.Vector3(0.011, -0.002, 0), new BABYLON.Vector3(0.01835, 0, 0)];
                // Do the drawing before exitHole have been subdivided, spare a few triangles.
                let tmpMesh = BABYLON.MeshBuilder.CreateLathe("exit-hole-in", { shape: [new BABYLON.Vector3(0.011, -0.1, 0), ...this.exitHolePath], tessellation: 32, sideOrientation: BABYLON.Mesh.DOUBLESIDE });
                let data = BABYLON.VertexData.ExtractFromMesh(tmpMesh);
                tmpMesh.dispose();
                Mummu.CatmullRomPathInPlace(this.exitHolePath, MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(90));
                Mummu.CatmullRomPathInPlace(this.exitHolePath, MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(90));
                Mummu.CatmullRomPathInPlace(this.exitHolePath, MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(90));
                this.exitHolePath = [new BABYLON.Vector3(0.011, -0.1, 0), ...this.exitHolePath];
                let colors = [];
                for (let i = 0; i < data.positions.length / 3; i++) {
                    if (data.positions[3 * i + 1] < -0.05) {
                        colors.push(0, 0, 0, 1);
                    }
                    else {
                        colors.push(1, 1, 1, 1);
                    }
                }
                data.colors = colors;
                let bottomData = Mummu.CreateQuadVertexData({
                    p1: new BABYLON.Vector3(-0.02, -0.1, -0.02),
                    p2: new BABYLON.Vector3(-0.02, -0.1, 0.02),
                    p3: new BABYLON.Vector3(0.02, -0.1, 0.02),
                    p4: new BABYLON.Vector3(0.02, -0.1, -0.02),
                    colors: new BABYLON.Color4(0, 0, 0, 1),
                    sideOrientation: 1
                });
                data = Mummu.MergeVertexDatas(data, bottomData);
                this.exitHoleIn = new BABYLON.Mesh("exit-hole-in");
                this.exitHoleIn.parent = this.root;
                this.exitHoleIn.material = this.game.materials.plasticBlack;
                data.applyToMesh(this.exitHoleIn);
                this.exitHoleOut = new BABYLON.Mesh("exit-hole-out");
                this.exitHoleOut.parent = this.root;
                this.exitHoleOut.material = this.game.materials.plasticBlack;
                data.applyToMesh(this.exitHoleOut);
                this.exitHoleOut.rotation.x = -Math.PI * 0.5;
            }
            if (this.TEST_USE_BASE_FPS) {
                this.fpsTexture = new BABYLON.DynamicTexture("fps-texture", { width: 794, height: 212 });
                let context = this.fpsTexture.getContext();
                context.clearRect(0, 0, 794, 212);
                context.fillStyle = "white";
                context.font = "bold 100px monospace";
                context.fillText("--- FPS", 8, 90);
                this.fpsTexture.update();
                setInterval(() => {
                    context.clearRect(0, 0, 794, 212);
                    context.fillStyle = "white";
                    context.font = "bold 80px monospace";
                    let timeElapsed = (performance.now() - THE_ORIGIN_OF_TIME_ms) / 1000;
                    context.fillText(timeElapsed.toFixed(0).padStart(4, "0") + " s", 400, 80);
                    context.fillText(this.game.averagedFPS.toFixed(0).padStart(3, " ") + " FPS (" + this.game.timeFactor.toFixed(2).padStart(3, " ") + ")", 8, 180);
                    this.fpsTexture.update();
                }, 1000);
                this.fpsMaterial = new BABYLON.StandardMaterial("fps-material");
                this.fpsMaterial.diffuseColor.copyFromFloats(1, 1, 1);
                this.fpsMaterial.diffuseTexture = this.fpsTexture;
                this.fpsMaterial.diffuseTexture.hasAlpha = true;
                this.fpsMaterial.useAlphaFromDiffuseTexture = true;
                this.fpsMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
                this.fpsMaterial.alpha = 0.6;
            }
        }
        get roomIndex() {
            return this._roomIndex;
        }
        setRoomIndex(roomIndex) {
            this._roomIndex = roomIndex;
            this.game.room.setRoomIndex(this.game.room.contextualRoomIndex(this._roomIndex, this.graphicQ));
        }
        get geometryQ() {
            let graphicQ = this.graphicQ;
            if (graphicQ === GraphicQuality.Proxy) {
                return GeometryQuality.Proxy;
            }
            else if (graphicQ === GraphicQuality.Low) {
                return GeometryQuality.Medium;
            }
            else if (graphicQ >= GraphicQuality.Medium) {
                return GeometryQuality.High;
            }
            return GeometryQuality.Low;
        }
        get materialQ() {
            let graphicQ = this.graphicQ;
            if (graphicQ >= GraphicQuality.High) {
                return MaterialQuality.PBR;
            }
            return MaterialQuality.Standard;
        }
        setAllIsSelectable(isSelectable) {
            for (let i = 0; i < this.parts.length; i++) {
                this.parts[i].isSelectable = isSelectable;
            }
        }
        async instantiate(hotReload) {
            this.instantiated = false;
            this.hasBeenOpenedInEditor = false;
            if (this.game.room) {
                this.game.room.setRoomIndex(this.game.room.contextualRoomIndex(this.roomIndex, this.graphicQ));
            }
            this.sleeperVertexData = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/sleepers.babylon");
            if (this.exitShooter) {
                this.exitShooter.instantiate();
                this.exitShooter.isPlaced = true;
            }
            if (this.exitTrack) {
                this.exitTrack.instantiate();
                this.exitTrack.isPlaced = true;
            }
            this.parts = this.parts.sort((a, b) => {
                return b.j + b.h - (a.j + a.h);
            });
            for (let i = 0; i < this.parts.length; i++) {
                if (!(hotReload && !this.parts[i].isPlaced)) {
                    await this.parts[i].instantiate();
                    this.parts[i].isPlaced = true;
                    await Nabu.Wait(1);
                }
            }
            for (let i = 0; i < this.balls.length; i++) {
                await this.balls[i].instantiate(hotReload);
            }
            for (let i = 0; i < this.decors.length; i++) {
                await this.decors[i].instantiate(hotReload);
            }
            return new Promise((resolve) => {
                requestAnimationFrame(() => {
                    for (let i = 0; i < this.parts.length; i++) {
                        this.parts[i].recomputeAbsolutePath();
                    }
                    if (this.exitShooter) {
                        this.exitShooter.recomputeAbsolutePath();
                    }
                    if (this.exitTrack) {
                        this.exitTrack.recomputeAbsolutePath();
                    }
                    this.instantiated = true;
                    resolve();
                });
            });
        }
        reset() {
            this.isChallengeMachine = false;
            this.name = MachineName.GetRandom();
            this.author = "";
            this.minimalAutoQualityFailed = GraphicQuality.VeryHigh + 1;
        }
        dispose() {
            this.reset();
            while (this.balls.length > 0) {
                this.balls[0].dispose();
            }
            while (this.parts.length > 0) {
                this.parts[0].dispose();
            }
            while (this.decors.length > 0) {
                this.decors[0].dispose();
            }
            this.instantiated = false;
            this.hasBeenOpenedInEditor = false;
        }
        getBallPos() {
            let datas = {
                balls: [],
                elevators: [],
                screws: [],
                stairways: [],
            };
            for (let i = 0; i < this.balls.length; i++) {
                let ball = this.balls[i];
                let data = {
                    p: ball.position.clone(),
                    v: ball.velocity.clone()
                };
                datas.balls.push(data);
            }
            let elevators = this.parts.filter(p => { return p instanceof MarbleRunSimulatorCore.Elevator; });
            for (let i = 0; i < elevators.length; i++) {
                datas.elevators.push(elevators[i].x);
            }
            let screws = this.parts.filter(p => { return p instanceof MarbleRunSimulatorCore.Screw; });
            for (let i = 0; i < screws.length; i++) {
                datas.screws.push(screws[i].a);
            }
            let stairways = this.parts.filter(p => { return p instanceof MarbleRunSimulatorCore.Stairway; });
            for (let i = 0; i < stairways.length; i++) {
                datas.stairways.push(stairways[i].a);
            }
            return datas;
        }
        applyBallPos(save) {
            for (let i = 0; i < this.balls.length && i < save.balls.length; i++) {
                let ball = this.balls[i];
                ball.position = save.balls[i].p.clone();
                ball.velocity = save.balls[i].v.clone();
            }
            let elevators = this.parts.filter(p => { return p instanceof MarbleRunSimulatorCore.Elevator; });
            for (let i = 0; i < elevators.length && i < save.elevators.length; i++) {
                elevators[i].x = save.elevators[i];
            }
            let screws = this.parts.filter(p => { return p instanceof MarbleRunSimulatorCore.Screw; });
            for (let i = 0; i < screws.length && i < save.screws.length; i++) {
                screws[i].a = save.elevators[i];
            }
            let stairways = this.parts.filter(p => { return p instanceof MarbleRunSimulatorCore.Stairway; });
            for (let i = 0; i < stairways.length && i < save.stairways.length; i++) {
                stairways[i].a = save.elevators[i];
            }
        }
        update() {
            if (!this.instantiated) {
                return;
            }
            if (this.requestUpdateBaseMesh) {
                this.generateBaseMesh();
            }
            if (this.requestUpdateShadow) {
                this.updateShadow();
            }
            this.updatingMachinePartCoordinates = false;
            let dt = this.game.scene.deltaTime / 1000;
            if (isFinite(dt)) {
                for (let i = 0; i < this.parts.length; i++) {
                    this.updatingMachinePartCoordinates = this.parts[i].updateTargetCoordinates(dt) || this.updatingMachinePartCoordinates;
                }
            }
            if (this.playing) {
                if (isFinite(dt)) {
                    for (let i = 0; i < this.balls.length; i++) {
                        this.balls[i].update(dt * this.game.currentTimeFactor);
                    }
                    for (let i = 0; i < this.parts.length; i++) {
                        this.parts[i].update(dt);
                    }
                }
                if (this.exitShooter) {
                    this.exitShooter.update(dt);
                }
            }
            else {
                for (let i = 0; i < this.balls.length; i++) {
                    this.balls[i].marbleLoopSound.setVolume(0, 0.1);
                    this.balls[i].marbleBowlLoopSound.setVolume(0, 0.1);
                }
                let dt = this.game.scene.deltaTime / 1000;
                if (isFinite(dt)) {
                    for (let i = 0; i < this.balls.length; i++) {
                        this.balls[i].updateMaterial(dt * this.game.currentTimeFactor);
                    }
                }
            }
        }
        play() {
            this._paused = false;
            this.playing = true;
            this.balls.forEach(ball => {
                ball.updateSelectorMeshVisibility();
            });
            this.decors.forEach(decor => {
                decor.findMachinePart();
            });
            this.onPlayCallbacks.forEach((callback) => {
                callback();
            });
        }
        get paused() {
            return this._paused;
        }
        pause() {
            this._paused = true;
            this.playing = false;
        }
        get stopped() {
            return !this.playing && !this.paused;
        }
        stop() {
            for (let i = 0; i < this.balls.length; i++) {
                this.balls[i].reset();
            }
            this.onStopCallbacks.forEach((callback) => {
                callback();
            });
            this._paused = false;
            this.playing = false;
        }
        async generateBaseMesh() {
            let previousBaseMinY = this.baseMeshMinY;
            this.baseMeshMinX = -MarbleRunSimulatorCore.tileWidth * 0.5;
            this.baseMeshMaxX = MarbleRunSimulatorCore.tileWidth * 0.5;
            this.baseMeshMinY = -MarbleRunSimulatorCore.tileHeight * 0.5;
            this.baseMeshMaxY = MarbleRunSimulatorCore.tileHeight;
            this.baseMeshMinZ = -MarbleRunSimulatorCore.tileDepth * 0.5;
            this.baseMeshMaxZ = MarbleRunSimulatorCore.tileDepth * 0.5;
            this.tracksMinX = Infinity;
            this.tracksMaxX = -Infinity;
            this.tracksMinY = Infinity;
            this.tracksMaxY = -Infinity;
            this.tracksMinZ = Infinity;
            this.tracksMaxZ = -Infinity;
            if (this.parts.length === 0) {
                this.tracksMinX = 0;
                this.tracksMaxX = 0;
                this.tracksMinY = 0;
                this.tracksMaxY = 0;
                this.tracksMinZ = 0;
                this.tracksMaxZ = 0;
            }
            let maxI = 1;
            let minJ = -1;
            let minK = -1;
            for (let i = 0; i < this.parts.length; i++) {
                let track = this.parts[i];
                this.baseMeshMinX = Math.min(this.baseMeshMinX, track.AABBMin.x);
                this.baseMeshMaxX = Math.max(this.baseMeshMaxX, track.AABBMax.x);
                //this.baseMeshMinY = Math.min(this.baseMeshMinY, track.position.y - tileHeight * (track.h + 1));
                this.baseMeshMaxY = Math.max(this.baseMeshMaxY, track.AABBMax.y);
                this.baseMeshMinZ = Math.min(this.baseMeshMinZ, track.AABBMin.z);
                this.baseMeshMaxZ = Math.max(this.baseMeshMaxZ, track.AABBMax.z);
                this.tracksMinX = Math.min(this.tracksMinX, track.position.x - MarbleRunSimulatorCore.tileWidth * 0.5);
                this.tracksMaxX = Math.max(this.tracksMaxX, track.position.x + MarbleRunSimulatorCore.tileWidth * (track.w - 0.5));
                this.tracksMinY = Math.min(this.tracksMinY, track.position.y - MarbleRunSimulatorCore.tileHeight * (track.h + 1));
                this.tracksMaxY = Math.max(this.tracksMaxY, track.position.y);
                this.tracksMinZ = Math.min(this.tracksMinZ, track.position.z - MarbleRunSimulatorCore.tileDepth * (track.d - 0.5));
                this.tracksMaxZ = Math.max(this.tracksMaxZ, track.position.z + MarbleRunSimulatorCore.tileDepth * 0.5);
                maxI = Math.max(maxI, track.i + track.w * 3);
                minJ = Math.min(minJ, track.j - track.d * 3);
                minK = Math.min(minK, track.k);
            }
            if (false && this.game.DEBUG_MODE) {
                if (this.debugAxis) {
                    this.debugAxis.dispose();
                }
                let x = (this.baseMeshMinX + this.baseMeshMaxX) * 0.5;
                let z = (this.baseMeshMinZ + this.baseMeshMaxZ) * 0.5;
                this.debugAxis = BABYLON.MeshBuilder.CreateLines("debug-axis", {
                    points: [new BABYLON.Vector3(x, this.baseMeshMaxY, z), new BABYLON.Vector3(x, this.baseMeshMinY, z), new BABYLON.Vector3(x + 0.1, this.baseMeshMinY, z)],
                });
            }
            if (false) {
                let w = this.baseMeshMaxX - this.baseMeshMinX;
                let h = this.baseMeshMaxY - this.baseMeshMinY;
                let u = w * 4;
                let v = h * 4;
                if (this.pedestalTop) {
                    this.pedestalTop.dispose();
                }
                this.pedestalTop = BABYLON.MeshBuilder.CreatePlane("base-wall", { width: h + 2 * this.margin, height: w + 2 * this.margin, sideOrientation: BABYLON.Mesh.DOUBLESIDE, frontUVs: new BABYLON.Vector4(0, 0, v, u) });
                this.pedestalTop.position.x = (this.baseMeshMaxX + this.baseMeshMinX) * 0.5;
                this.pedestalTop.position.y = (this.baseMeshMaxY + this.baseMeshMinY) * 0.5;
                this.pedestalTop.position.z += 0.016;
                this.pedestalTop.rotation.z = Math.PI / 2;
                if (this.baseFrame) {
                    this.baseFrame.dispose();
                }
                this.baseFrame = new BABYLON.Mesh("base-frame");
                this.baseFrame.position.copyFrom(this.pedestalTop.position);
                this.baseFrame.material = this.game.materials.getMaterial(0, this.materialQ);
                let vertexDatas = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/base-frame.babylon");
                let data = Mummu.CloneVertexData(vertexDatas[0]);
                let positions = [...data.positions];
                for (let i = 0; i < positions.length / 3; i++) {
                    let x = positions[3 * i];
                    let y = positions[3 * i + 1];
                    if (x > 0) {
                        positions[3 * i] += w * 0.5 - 0.01 + this.margin;
                    }
                    else if (x < 0) {
                        positions[3 * i] -= w * 0.5 - 0.01 + this.margin;
                    }
                    if (y > 0) {
                        positions[3 * i + 1] += h * 0.5 - 0.01 + this.margin;
                    }
                    else if (y < 0) {
                        positions[3 * i + 1] -= h * 0.5 - 0.01 + this.margin;
                    }
                }
                data.positions = positions;
                data.applyToMesh(this.baseFrame);
            }
            else {
                let w = this.baseMeshMaxX - this.baseMeshMinX;
                let h = 1;
                let d = this.baseMeshMaxZ - this.baseMeshMinZ;
                if (this.baseFrame) {
                    if (this.game.room) {
                        let i1 = this.game.room.light1.includedOnlyMeshes.indexOf(this.baseFrame);
                        if (i1 != -1) {
                            this.game.room.light1.includedOnlyMeshes.splice(i1, 1);
                        }
                        let i2 = this.game.room.light2.includedOnlyMeshes.indexOf(this.baseFrame);
                        if (i2 != -1) {
                            this.game.room.light2.includedOnlyMeshes.splice(i2, 1);
                        }
                    }
                    this.baseFrame.dispose();
                }
                this.baseFrame = new BABYLON.Mesh("base-stand");
                this.baseFrame.parent = this.root;
                this.baseFrame.position.x = (this.baseMeshMaxX + this.baseMeshMinX) * 0.5;
                this.baseFrame.position.y = this.baseMeshMinY;
                this.baseFrame.position.z = (this.baseMeshMaxZ + this.baseMeshMinZ) * 0.5;
                this.baseFrame.material = this.root.material;
                this.game.spotLight.excludedMeshes = [this.baseFrame];
                if (this.game.room) {
                    this.game.room.light1.includedOnlyMeshes.push(this.baseFrame);
                    this.game.room.light2.includedOnlyMeshes.push(this.baseFrame);
                }
                let vertexDatas = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/museum-stand.babylon");
                let data;
                if (this.hasExitHole) {
                    data = Mummu.CloneVertexData(vertexDatas[2]);
                }
                else {
                    data = Mummu.CloneVertexData(vertexDatas[0]);
                }
                Mummu.ColorizeVertexDataInPlace(data, BABYLON.Color3.FromHexString(this.baseColor));
                let positions = [...data.positions];
                for (let i = 0; i < positions.length / 3; i++) {
                    let x = positions[3 * i];
                    let z = positions[3 * i + 2];
                    if (x > 0) {
                        positions[3 * i] += w * 0.5 - 0.5 + this.margin;
                    }
                    else if (x < 0) {
                        positions[3 * i] -= w * 0.5 - 0.5 + this.margin;
                    }
                    if (z > 0) {
                        positions[3 * i + 2] += d * 0.5 - 0.5 + this.margin;
                    }
                    else if (z < 0) {
                        positions[3 * i + 2] -= d * 0.5 - 0.5 + this.margin;
                    }
                }
                data.positions = positions;
                data.applyToMesh(this.baseFrame);
                if (this.pedestalTop) {
                    this.pedestalTop.dispose();
                }
                this.pedestalTop = new BABYLON.Mesh("pedestal-top");
                this.pedestalTop.parent = this.root;
                this.pedestalTop.receiveShadows = true;
                this.pedestalTop.position.x = (this.baseMeshMaxX + this.baseMeshMinX) * 0.5;
                this.pedestalTop.position.y = this.baseMeshMinY;
                this.pedestalTop.position.z = (this.baseMeshMaxZ + this.baseMeshMinZ) * 0.5;
                //this.pedestalTop.material = this.game.materials.velvetMaterial;
                this.pedestalTop.material = this.game.materials.floorMaterial;
                if (this.hasExitHole) {
                    data = Mummu.CloneVertexData(vertexDatas[3]);
                }
                else {
                    data = Mummu.CloneVertexData(vertexDatas[1]);
                }
                let uvs = [];
                positions = [...data.positions];
                for (let i = 0; i < positions.length / 3; i++) {
                    let x = positions[3 * i];
                    let z = positions[3 * i + 2];
                    if (x > 0) {
                        positions[3 * i] += w * 0.5 - 0.5 + this.margin;
                    }
                    else if (x < 0) {
                        positions[3 * i] -= w * 0.5 - 0.5 + this.margin;
                    }
                    if (z > 0) {
                        positions[3 * i + 2] += d * 0.5 - 0.5 + this.margin;
                    }
                    else if (z < 0) {
                        positions[3 * i + 2] -= d * 0.5 - 0.5 + this.margin;
                    }
                    //uvs.push(positions[3 * i] * 2);
                    //uvs.push(positions[3 * i + 2] * 2);
                    uvs.push(positions[3 * i] / MarbleRunSimulatorCore.tileSize + 0.5);
                    uvs.push(positions[3 * i + 2] / MarbleRunSimulatorCore.tileSize + 0.5);
                }
                data.positions = positions;
                data.uvs = uvs;
                data.applyToMesh(this.pedestalTop);
                if (this.baseLogo) {
                    this.baseLogo.dispose();
                }
                this.baseLogo = new BABYLON.Mesh("base-logo");
                this.baseLogo.parent = this.root;
                this.baseLogo.position.x = (this.baseMeshMaxX + this.baseMeshMinX) * 0.5;
                this.baseLogo.position.y = this.baseMeshMinY + 0.0001;
                this.baseLogo.position.z = (this.baseMeshMaxZ + this.baseMeshMinZ) * 0.5;
                let w05 = w * 0.5;
                let d05 = d * 0.5;
                let logoW = Math.max(w * 0.3, 0.1);
                let logoH = (logoW / 794) * 212;
                let corner1Data = Mummu.CreateQuadVertexData({
                    p1: new BABYLON.Vector3(w05 - logoW, 0, -d05),
                    p2: new BABYLON.Vector3(w05, 0, -d05),
                    p3: new BABYLON.Vector3(w05, 0, -d05 + logoH),
                    p4: new BABYLON.Vector3(w05 - logoW, 0, -d05 + logoH),
                });
                Mummu.TranslateVertexDataInPlace(corner1Data, new BABYLON.Vector3(this.margin - 0.02, 0, -this.margin + 0.02));
                let corner2Data = Mummu.CreateQuadVertexData({
                    p1: new BABYLON.Vector3(-w05 + logoW, 0, d05),
                    p2: new BABYLON.Vector3(-w05, 0, d05),
                    p3: new BABYLON.Vector3(-w05, 0, d05 - logoH),
                    p4: new BABYLON.Vector3(-w05 + logoW, 0, d05 - logoH),
                });
                Mummu.TranslateVertexDataInPlace(corner2Data, new BABYLON.Vector3(-this.margin + 0.02, 0, this.margin - 0.02));
                Mummu.MergeVertexDatas(corner1Data, corner2Data).applyToMesh(this.baseLogo);
                this.baseLogo.material = this.game.materials.logoMaterial;
                if (this.TEST_USE_BASE_FPS) {
                    if (this.baseFPS) {
                        this.baseFPS.dispose();
                    }
                    this.baseFPS = new BABYLON.Mesh("base-logo");
                    this.baseFPS.parent = this.root;
                    this.baseFPS.position.x = (this.baseMeshMaxX + this.baseMeshMinX) * 0.5;
                    this.baseFPS.position.y = this.baseMeshMinY + 0.0001;
                    this.baseFPS.position.z = (this.baseMeshMaxZ + this.baseMeshMinZ) * 0.5;
                    let corner1DataFPS = Mummu.CloneVertexData(corner1Data);
                    Mummu.TranslateVertexDataInPlace(corner1DataFPS, new BABYLON.Vector3(0, 0, logoH));
                    let corner2DataFPS = Mummu.CloneVertexData(corner2Data);
                    Mummu.TranslateVertexDataInPlace(corner2DataFPS, new BABYLON.Vector3(0, 0, -logoH));
                    Mummu.MergeVertexDatas(corner1DataFPS, corner2DataFPS).applyToMesh(this.baseFPS);
                    this.baseFPS.material = this.fpsMaterial;
                }
                this.regenerateBaseAxis();
            }
            if (previousBaseMinY != this.baseMeshMinY) {
                for (let i = 0; i < this.parts.length; i++) {
                    this.parts[i].doSleepersMeshUpdate();
                }
            }
            if (this.game.room) {
                this.game.room.setGroundHeight(this.baseMeshMinY - 0.8);
            }
            if (this.exitShooter) {
                this.exitShooter.setI(maxI - 6, true);
                this.exitShooter.setJ(minJ - 1, true);
                this.exitShooter.setK(minK - 2, true);
                this.exitShooter.recomputeAbsolutePath();
                this.exitShooter.refreshEncloseMeshAndAABB();
            }
            if (this.exitTrack) {
                this.exitTrack.setI(maxI - 3, true);
                this.exitTrack.setJ(minJ - 1, true);
                this.exitTrack.setK(minK - 3, true);
                this.exitTrack.recomputeAbsolutePath();
                this.exitTrack.refreshEncloseMeshAndAABB();
            }
            if (this.exitHoleIn) {
                this.exitHoleIn.position.x = this.baseMeshMinX - 0.015;
                this.exitHoleIn.position.y = this.baseMeshMinY;
                this.exitHoleIn.position.z = this.baseMeshMinZ - 0.015;
            }
            if (this.exitHoleOut) {
                this.exitHoleOut.position.x = this.baseMeshMaxX - 0.015;
                this.exitHoleOut.position.y = this.baseMeshMinY - 0.055;
                this.exitHoleOut.position.z = this.baseMeshMinZ - 0.05;
            }
            this.game.spotLight.position.y = this.baseMeshMinY + 2.2;
            this.game.spotLight.parent = this.root;
            let dir = new BABYLON.Vector3((this.baseMeshMinX + this.baseMeshMaxX) * 0.5, -3, (this.baseMeshMinZ + this.baseMeshMaxZ) * 0.5).normalize();
            this.game.spotLight.direction = dir;
            this.ready = true;
            this.requestUpdateBaseMesh = false;
        }
        regenerateBaseAxis() {
            if (this.baseAxis) {
                this.baseAxis.dispose();
            }
            if (false && this.game.mode === GameMode.Create) {
                let w = this.baseMeshMaxX - this.baseMeshMinX;
                let d = this.baseMeshMaxZ - this.baseMeshMinZ;
                let w05 = w * 0.5;
                let d05 = d * 0.5;
                let s = Math.min(w05, d05) * 0.9;
                this.baseAxis = new BABYLON.Mesh("base-logo");
                this.baseAxis.parent = this.root;
                let axisSquareData = Mummu.CreateQuadVertexData({
                    p1: new BABYLON.Vector3(-s, 0, -s),
                    p2: new BABYLON.Vector3(s, 0, -s),
                    p3: new BABYLON.Vector3(s, 0, s),
                    p4: new BABYLON.Vector3(-s, 0, s),
                });
                axisSquareData.applyToMesh(this.baseAxis);
                this.baseAxis.position.x = (this.baseMeshMaxX + this.baseMeshMinX) * 0.5;
                this.baseAxis.position.y = this.baseMeshMinY + 0.0001;
                this.baseAxis.position.z = (this.baseMeshMaxZ + this.baseMeshMinZ) * 0.5;
                this.baseAxis.material = this.game.materials.baseAxisMaterial;
            }
        }
        setBaseIsVisible(v) {
            if (this.baseFrame) {
                this.baseFrame.isVisible = v;
            }
            if (this.pedestalTop) {
                this.pedestalTop.isVisible = v;
            }
            if (this.baseLogo) {
                this.baseLogo.isVisible = v;
            }
            if (this.baseFPS) {
                this.baseFPS.isVisible = v;
            }
            if (this.baseAxis) {
                this.baseAxis.isVisible = v;
            }
        }
        getBankAt(pos, exclude) {
            for (let i = 0; i < this.parts.length; i++) {
                let part = this.parts[i];
                if (part != exclude) {
                    for (let j = 0; j < part.tracks.length; j++) {
                        let track = part.tracks[j];
                        if (BABYLON.Vector3.DistanceSquared(track.startWorldPosition, pos) < 0.000001) {
                            return { isEnd: false, bank: track.preferedStartBank, part: part, pipeTrack: track instanceof MarbleRunSimulatorCore.PipeTrack || track instanceof MarbleRunSimulatorCore.WoodTrack };
                        }
                        if (BABYLON.Vector3.DistanceSquared(track.endWorldPosition, pos) < 0.000001) {
                            return { isEnd: true, bank: track.preferedEndBank, part: part, pipeTrack: track instanceof MarbleRunSimulatorCore.PipeTrack || track instanceof MarbleRunSimulatorCore.WoodTrack };
                        }
                    }
                }
            }
        }
        static MachineDataCompare(d1, d2) {
            if (d1 && d2) {
                if (d1.v === d2.v) {
                    if (d1.n === d2.n) {
                        if (d1.a === d2.a) {
                            if (d1.d && d1.d === d2.d) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }
        serialize() {
            return MarbleRunSimulatorCore.SerializeV12(this);
        }
        static MakeMiniature(machine, data) {
            if (data && (data.v === 2)) {
                let canvas = document.createElement("canvas");
                MarbleRunSimulatorCore.DeserializeV2(machine, data, true, canvas);
                return canvas;
            }
            if (data && (data.v >= 3 && data.v <= 6)) {
                let canvas = document.createElement("canvas");
                MarbleRunSimulatorCore.DeserializeV3456(machine, data, true, canvas);
                return canvas;
            }
            if (data && (data.v === 7 || data.v === 8)) {
                let canvas = document.createElement("canvas");
                MarbleRunSimulatorCore.DeserializeV78(machine, data, true, canvas);
                return canvas;
            }
            if (data && (data.v === 9 || data.v === 10)) {
                let canvas = document.createElement("canvas");
                MarbleRunSimulatorCore.DeserializeV910(machine, data, true, canvas);
                return canvas;
            }
            if (data && (data.v === 11)) {
                let canvas = document.createElement("canvas");
                MarbleRunSimulatorCore.DeserializeV11(machine, data, true, canvas);
                return canvas;
            }
            if (data && (data.v === 12)) {
                let canvas = document.createElement("canvas");
                MarbleRunSimulatorCore.DeserializeV12(machine, data, true, canvas);
                return canvas;
            }
            return undefined;
        }
        deserialize(data, makeMiniature) {
            this.lastDeserializedData = data;
            this.minimalAutoQualityFailed = GraphicQuality.VeryHigh + 1;
            this.isChallengeMachine = false;
            if (data) {
                let version;
                if (isFinite(data.v)) {
                    version = data.v;
                }
                console.log("deserialize version " + version);
                if (!isFinite(version) || version === 1) {
                    return MarbleRunSimulatorCore.DeserializeV1(this, data);
                }
                else if (version === 2) {
                    return MarbleRunSimulatorCore.DeserializeV2(this, data);
                }
                else if (version === 3 || version === 4 || version === 5 || version === 6) {
                    return MarbleRunSimulatorCore.DeserializeV3456(this, data);
                }
                else if (version === 7 || version === 8) {
                    return MarbleRunSimulatorCore.DeserializeV78(this, data);
                }
                else if (version === 9 || version === 10) {
                    return MarbleRunSimulatorCore.DeserializeV910(this, data);
                }
                else if (version === 11) {
                    return MarbleRunSimulatorCore.DeserializeV11(this, data, makeMiniature);
                }
                else if (version === 12) {
                    return MarbleRunSimulatorCore.DeserializeV12(this, data, makeMiniature);
                }
            }
        }
        getEncloseStart() {
            let encloseStart = new BABYLON.Vector3(Infinity, -Infinity, -Infinity);
            this.parts.forEach((part) => {
                encloseStart.x = Math.min(encloseStart.x, part.position.x + part.encloseStart.x);
                encloseStart.y = Math.max(encloseStart.y, part.position.y + part.encloseStart.y);
                encloseStart.z = Math.max(encloseStart.z, part.position.z + part.encloseStart.z);
            });
            if (!Mummu.IsFinite(encloseStart)) {
                encloseStart.copyFromFloats(0, 0, 0);
            }
            return encloseStart;
        }
        getEncloseEnd() {
            let encloseEnd = new BABYLON.Vector3(-Infinity, Infinity, Infinity);
            this.parts.forEach((part) => {
                encloseEnd.x = Math.max(encloseEnd.x, part.position.x + part.encloseEnd.x);
                encloseEnd.y = Math.min(encloseEnd.y, part.position.y + part.encloseEnd.y);
                encloseEnd.z = Math.min(encloseEnd.z, part.position.z + part.encloseEnd.z);
            });
            if (!Mummu.IsFinite(encloseEnd)) {
                encloseEnd.copyFromFloats(0, 0, 0);
            }
            return encloseEnd;
        }
        updateShadow() {
            if (this.game.shadowGenerator) {
                this.parts = this.parts.sort((a, b) => {
                    return b.j - a.j;
                });
                this.game.shadowGenerator.getShadowMapForRendering().renderList = [];
                for (let i = 0; i < 20; i++) {
                    if (i < this.parts.length) {
                        this.game.shadowGenerator.addShadowCaster(this.parts[i], true);
                    }
                }
                for (let i = 0; i < 10; i++) {
                    if (i < this.balls.length) {
                        this.game.shadowGenerator.addShadowCaster(this.balls[i], true);
                    }
                }
            }
        }
    }
    MarbleRunSimulatorCore.Machine = Machine;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
class MachineName {
    static GetRandom() {
        let r1 = Math.floor(Math.random() * MachineName.PartOnes.length);
        let r2 = Math.floor(Math.random() * MachineName.PartTwos.length);
        let r3 = Math.floor(Math.random() * MachineName.PartThrees.length);
        let r4 = Math.floor(Math.random() * MachineName.PartFours.length);
        return MachineName.PartOnes[r1] + MachineName.PartTwos[r2] + MachineName.PartThrees[r3] + MachineName.PartFours[r4];
    }
}
MachineName.PartOnes = [
    "The ",
    "A ",
    "Our ",
    "My ",
    ""
];
MachineName.PartTwos = [
    "Great ",
    "Magnificent ",
    "Intricated ",
    "Simple ",
    "Nice ",
    "Cool ",
    "Complex ",
    "Awesome ",
    "Big ",
    "Huge ",
    "Small ",
    "Little ",
    "Best ",
    "Cute ",
    "Tiny "
];
MachineName.PartThrees = [
    "Ball ",
    "Loop ",
    "Curve ",
    "Rail ",
    "Spiral ",
    "Steel ",
    "Track ",
    "Marble ",
    "Brass ",
    "Copper ",
    "Toggle ",
    "Split "
];
MachineName.PartFours = [
    "Machine",
    "Factory",
    "Thing",
    "Invention",
    "Construction",
    "Computer",
    "Engine",
    "Knot",
    "Building"
];
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    MarbleRunSimulatorCore.tileSize = 0.025;
    MarbleRunSimulatorCore.tileWidth = 0.075;
    MarbleRunSimulatorCore.legacyTileHeight = 0.03;
    MarbleRunSimulatorCore.tileHeight = 0.025;
    MarbleRunSimulatorCore.legacyTileDepth = 0.06;
    MarbleRunSimulatorCore.tileDepth = 0.075;
    MarbleRunSimulatorCore.colorSlotsCount = 6;
    let PartVisibilityMode;
    (function (PartVisibilityMode) {
        PartVisibilityMode[PartVisibilityMode["Default"] = 0] = "Default";
        PartVisibilityMode[PartVisibilityMode["Selected"] = 1] = "Selected";
        PartVisibilityMode[PartVisibilityMode["Ghost"] = 2] = "Ghost";
    })(PartVisibilityMode = MarbleRunSimulatorCore.PartVisibilityMode || (MarbleRunSimulatorCore.PartVisibilityMode = {}));
    var selectorHullShapeDisplayTip = [];
    for (let i = 0; i < 10; i++) {
        let a = (i / 10) * 2 * Math.PI;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        selectorHullShapeDisplayTip[i] = new BABYLON.Vector3(cosa * 0.01, sina * 0.01, 0);
    }
    var selectorHullPipeShapeDisplayTip = [];
    for (let i = 0; i < 10; i++) {
        let a = (i / 10) * 2 * Math.PI;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        selectorHullPipeShapeDisplayTip[i] = new BABYLON.Vector3(cosa * 0.014, sina * 0.014, 0);
    }
    var selectorHullShapeDisplay = [];
    for (let i = 0; i < 10; i++) {
        let a = (i / 10) * 2 * Math.PI;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        selectorHullShapeDisplay[i] = new BABYLON.Vector3(cosa * 0.009, sina * 0.009, 0);
    }
    var selectorHullPipeShapeDisplay = [];
    for (let i = 0; i < 10; i++) {
        let a = (i / 10) * 2 * Math.PI;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        selectorHullPipeShapeDisplay[i] = new BABYLON.Vector3(cosa * 0.012, sina * 0.012, 0);
    }
    class MachinePartSelectorMesh extends BABYLON.Mesh {
        constructor(part) {
            super("machine-part-selector");
            this.part = part;
        }
    }
    MarbleRunSimulatorCore.MachinePartSelectorMesh = MachinePartSelectorMesh;
    class EndpointSelectorMesh extends BABYLON.Mesh {
        constructor(endpoint) {
            super("endpoint-selector");
            this.endpoint = endpoint;
        }
    }
    MarbleRunSimulatorCore.EndpointSelectorMesh = EndpointSelectorMesh;
    class MachinePartEndpoint {
        constructor(localPosition, localR, machinePart) {
            this.localPosition = localPosition;
            this.localR = localR;
            this.machinePart = machinePart;
            this.i = 0;
            this.j = 0;
            this.k = 0;
            this.index = -1;
            this._absolutePosition = BABYLON.Vector3.Zero();
            this._hovered = false;
            let dir = Mummu.Rotate(BABYLON.Axis.X, BABYLON.Axis.Y, -localR * Math.PI * 0.5);
            this.i = Math.round((localPosition.x + dir.x * MarbleRunSimulatorCore.tileSize * 0.5) / MarbleRunSimulatorCore.tileSize);
            this.j = Math.round((localPosition.z + dir.z * MarbleRunSimulatorCore.tileSize * 0.5) / MarbleRunSimulatorCore.tileSize);
            this.k = Math.round((localPosition.y) / MarbleRunSimulatorCore.tileHeight);
        }
        get leftSide() {
            return this.localPosition.x < 0;
        }
        get upperSide() {
            return this.localPosition.y > this.machinePart.encloseMid.y;
        }
        get farSide() {
            return this.localPosition.z > this.machinePart.encloseMid.z;
        }
        get isOrigin() {
            return this.index === 0;
        }
        isIJK(worldIJK) {
            return (this.i + this.machinePart.i) === worldIJK.i && (this.j + this.machinePart.j) === worldIJK.j && (this.k + this.machinePart.k) === worldIJK.k;
        }
        get absolutePosition() {
            BABYLON.Vector3.TransformCoordinatesToRef(this.localPosition, this.machinePart.getWorldMatrix(), this._absolutePosition);
            return this._absolutePosition;
        }
        getRotatedI(r) {
            if (r === 0) {
                return this.i;
            }
            if (r === 1) {
                return -this.j;
            }
            if (r === 2) {
                return -this.i;
            }
            if (r === 3) {
                return this.j;
            }
        }
        getRotatedJ(r) {
            if (r === 0) {
                return this.j;
            }
            if (r === 1) {
                return this.i;
            }
            if (r === 2) {
                return -this.j;
            }
            if (r === 3) {
                return -this.i;
            }
        }
        get absoluteR() {
            return (this.machinePart.r + this.localR) % 4;
        }
        get absoluteRAfterUpdate() {
            return (this.machinePart.rAfterUpdate + this.localR) % 4;
        }
        connectTo(endPoint) {
            this.connectedEndPoint = endPoint;
            endPoint.connectedEndPoint = this;
        }
        disconnect() {
            if (this.connectedEndPoint) {
                this.connectedEndPoint.connectedEndPoint = undefined;
            }
            this.connectedEndPoint = undefined;
        }
        hover() {
            this._hovered = true;
            this.updateSelectorMeshVisibility();
        }
        anhover() {
            this._hovered = false;
            this.updateSelectorMeshVisibility();
        }
        updateSelectorMeshVisibility() {
            let selectorMesh = this.machinePart.selectorEndpointsDisplay[this.index];
            if (selectorMesh) {
                selectorMesh.renderOutline = true;
                selectorMesh.outlineWidth = 0.001;
                selectorMesh.outlineColor.copyFromFloats(0.5, 0.5, 0.5);
                selectorMesh.material = this.machinePart.game.materials.selectorFullLitBlueMaterial;
                let originEndpoint = this.machinePart.endPoints[0];
                if (this != this.machinePart.endPoints[0]) {
                    if (this.localPosition.y < originEndpoint.localPosition.y) {
                        selectorMesh.material = this.machinePart.game.materials.selectorFullLitGreenMaterial;
                    }
                    else if (this.localPosition.y > originEndpoint.localPosition.y) {
                        selectorMesh.material = this.machinePart.game.materials.selectorFullLitLightBlueMaterial;
                    }
                }
                if (this._hovered) {
                    selectorMesh.isVisible = true;
                    selectorMesh.visibility = 1;
                    selectorMesh.outlineColor.copyFromFloats(1, 1, 1);
                }
                else if (this.machinePart.selected) {
                    selectorMesh.isVisible = true;
                    selectorMesh.visibility = 1;
                }
                else {
                    selectorMesh.isVisible = false;
                    selectorMesh.visibility = 0;
                }
            }
        }
        showHelperMesh() {
            if (!this.helperMesh) {
                let data = BABYLON.CreateSphereVertexData({ segments: 12, diameter: 0.018 });
                Mummu.RotateAngleAxisVertexDataInPlace(data, Math.PI * 0.5, BABYLON.Axis.Z);
                this.helperMesh = new BABYLON.Mesh("helper-mesh");
                this.helperMesh.alphaIndex = 1;
                data.applyToMesh(this.helperMesh);
            }
        }
        hideHelperMesh() {
            if (this.helperMesh) {
                this.helperMesh.dispose();
                this.helperMesh = undefined;
            }
        }
        updateHelperMesh(mode, color, timer) {
            if (this.helperMesh) {
                if (color === -1) {
                    this.helperMesh.material = this.machinePart.game.materials.selectorFullLitGreenMaterial;
                }
                else if (color === 0) {
                    this.helperMesh.material = this.machinePart.game.materials.selectorFullLitBlueMaterial;
                }
                else if (color === 1) {
                    this.helperMesh.material = this.machinePart.game.materials.selectorFullLitLightBlueMaterial;
                }
                if (mode === 0) {
                    let sign = this.leftSide ? 1 : -1;
                    this.helperMesh.position.copyFrom(this.absolutePosition);
                    //this.helperMesh.position.x -= sign * 0.5 * 0.015;
                    this.helperMesh.visibility = Math.sin(timer * Math.PI) * 1;
                }
                else if (mode === 1) {
                    let sign = this.leftSide ? 1 : -1;
                    let fPos = timer * 4 / 3;
                    fPos = Nabu.MinMax(fPos, 0, 1);
                    this.helperMesh.position.copyFrom(this.absolutePosition);
                    this.helperMesh.position.x -= sign * Nabu.Easing.easeOutCubic(fPos) * 0.015;
                    let fAlpha = timer;
                    if (fAlpha < 0.2) {
                        this.helperMesh.visibility = Nabu.Easing.easeInOutSine(fAlpha) * 0.5;
                    }
                    else if (fAlpha < 0.6) {
                        this.helperMesh.visibility = 0.3;
                    }
                    else if (fAlpha < 0.8) {
                        let fAlpha2 = Nabu.Easing.easeInOutSine((fAlpha - 0.6) / 0.2);
                        this.helperMesh.visibility = 0.3 * (1 - fAlpha2) + 0.7 * fAlpha2;
                    }
                    else {
                        let fAlpha2 = Nabu.Easing.easeInOutSine((fAlpha - 0.8) / 0.2);
                        this.helperMesh.visibility = 0.7 * (1 - fAlpha2) + 0 * fAlpha2;
                    }
                }
            }
        }
    }
    MarbleRunSimulatorCore.MachinePartEndpoint = MachinePartEndpoint;
    class MachinePart extends BABYLON.Mesh {
        constructor(machine, prop, isPlaced = true) {
            super("track", machine.game.scene);
            this.machine = machine;
            this.isPlaced = isPlaced;
            this.fullPartName = "";
            this.tracks = [];
            this.wires = [];
            this.allWires = [];
            this.wireSize = 0.0015;
            this.wireGauge = 0.014;
            this.colors = [0];
            this.sleepersMeshes = new Map();
            this.selectorEndpointsDisplay = [];
            this.selectorEndpointsLogic = [];
            this.isSelectable = true;
            this.summedLength = [0];
            this.totalLength = 0;
            this.globalSlope = 0;
            this.localBarycenter = BABYLON.Vector3.Zero();
            this.localBarycenterIJK = BABYLON.Vector3.Zero();
            this.AABBMin = BABYLON.Vector3.Zero();
            this.AABBMax = BABYLON.Vector3.Zero();
            this.visibleWidth = 1;
            this.visibleHeight = 1;
            this.visibleDepth = 1;
            this.encloseStart = BABYLON.Vector3.Zero();
            this.enclose13 = BABYLON.Vector3.One().scaleInPlace(1 / 3);
            this.encloseMid = BABYLON.Vector3.One().scaleInPlace(0.5);
            this.enclose23 = BABYLON.Vector3.One().scaleInPlace(2 / 3);
            this.encloseEnd = BABYLON.Vector3.One();
            this.localCenter = BABYLON.Vector3.Zero();
            this.endPoints = [];
            this.neighbours = new Nabu.UniqueList();
            this.decors = [];
            this.offsetPosition = BABYLON.Vector3.Zero();
            this._i = 0;
            this._j = 0;
            this._k = 0;
            this._r = 0;
            this._partVisibilityMode = PartVisibilityMode.Default;
            this._selected = false;
            this._multiSelected = false;
            this._hovered = false;
            this._alignShadow = () => {
                if (this._selected) {
                    this.gridRectMesh.position.x = this.position.x;
                    this.gridRectMesh.position.y = -MarbleRunSimulatorCore.tileHeight * 0.5;
                    this.gridRectMesh.position.z = this.position.z;
                    this.gridRectMesh.rotation.y = this.rotation.y;
                    let points = [
                        new BABYLON.Vector3(this.encloseStart.x, 0, this.encloseStart.z),
                        new BABYLON.Vector3(this.encloseEnd.x, 0, this.encloseStart.z),
                        new BABYLON.Vector3(this.encloseEnd.x, 0, this.encloseEnd.z),
                        new BABYLON.Vector3(this.encloseStart.x, 0, this.encloseEnd.z)
                    ];
                    BABYLON.Vector3.TransformCoordinatesToRef(points[0], this.getWorldMatrix(), points[0]);
                    BABYLON.Vector3.TransformCoordinatesToRef(points[1], this.getWorldMatrix(), points[1]);
                    BABYLON.Vector3.TransformCoordinatesToRef(points[2], this.getWorldMatrix(), points[2]);
                    BABYLON.Vector3.TransformCoordinatesToRef(points[3], this.getWorldMatrix(), points[3]);
                    let dirs = [
                        points[1].subtract(points[0]).normalize(),
                        points[2].subtract(points[1]).normalize(),
                        points[3].subtract(points[2]).normalize(),
                        points[0].subtract(points[3]).normalize()
                    ];
                    let camRight = this._scene.activeCamera.getDirection(BABYLON.Axis.X);
                    let bestDir = 0;
                    let dots = dirs.map(d => { return BABYLON.Vector3.Dot(d, camRight); });
                    if (dots[0] >= dots[1] && dots[0] >= dots[2] && dots[0] >= dots[3]) {
                        bestDir = 0;
                    }
                    else if (dots[1] >= dots[0] && dots[1] >= dots[2] && dots[1] >= dots[3]) {
                        bestDir = 1;
                    }
                    else if (dots[2] >= dots[0] && dots[2] >= dots[1] && dots[2] >= dots[3]) {
                        bestDir = 2;
                    }
                    else {
                        bestDir = 3;
                    }
                    let lines = [];
                    for (let i = bestDir; i < bestDir + 2; i++) {
                        let low = new BABYLON.Vector3(points[i % 4].x, -MarbleRunSimulatorCore.tileHeight * 0.5, points[i % 4].z);
                        let high = new BABYLON.Vector3(points[i % 4].x, this.position.y + this.encloseStart.y, points[i % 4].z);
                        lines.push([low, high]);
                        let l = Math.round((high.y - low.y) / (MarbleRunSimulatorCore.tileHeight * 0.5));
                        let d = dirs[bestDir];
                        for (let j = 1; j < l; j++) {
                            let p = low.clone();
                            p.y += j * MarbleRunSimulatorCore.tileHeight * 0.5;
                            let r = j % 2 === 0 ? 0.005 : 0.0025;
                            if (i > bestDir) {
                                r *= -1;
                            }
                            let px0 = p.clone();
                            let px1 = p.clone();
                            px1.x += d.x * r;
                            px1.z += d.z * r;
                            //let pz0 = p.clone().addInPlaceFromFloats(0, 0, - r);
                            //let pz1 = p.clone().addInPlaceFromFloats(0, 0, r);
                            lines.push([px0, px1]);
                        }
                    }
                    if (this.gridHeightMesh) {
                        this.gridHeightMesh.dispose();
                    }
                    this.gridHeightMesh = BABYLON.MeshBuilder.CreateLineSystem("gridHeightMesh", { lines: lines });
                    this.gridHeightMesh.position.y = 0;
                }
            };
            this.instantiated = false;
            this._lastDist = Infinity;
            //let origin = Mummu.DrawDebugPoint(BABYLON.Vector3.Zero(), Infinity, BABYLON.Color3.Red(), 0.02);
            //origin.parent = this;
            if (prop.fullPartName) {
                this.fullPartName = prop.fullPartName;
            }
            this._i = prop.i;
            this._j = prop.j;
            this._k = prop.k;
            if (isFinite(prop.r)) {
                this._r = prop.r;
            }
            if (typeof prop.c === "number") {
                this.colors = [prop.c];
            }
            else if (prop.c instanceof Array) {
                this.colors = [...prop.c];
            }
            this.position.x = this._i * MarbleRunSimulatorCore.tileSize;
            this.position.y = this._k * MarbleRunSimulatorCore.tileHeight;
            this.position.z = this._j * MarbleRunSimulatorCore.tileSize;
            this.rotation.y = -this._r * Math.PI * 0.5;
            this.sleepersMeshProp = this.machine.sleepersMeshProp;
            this.parent = this.machine.root;
            this.tracks = [];
            this.refreshEncloseMeshAndAABB();
        }
        get partName() {
            return this.template ? this.template.partName : "machine-part-no-template";
        }
        get game() {
            return this.machine.game;
        }
        getColor(index) {
            index = Nabu.MinMax(index, 0, this.colors.length - 1);
            return this.colors[index];
        }
        findEndPoint(localPosition) {
            return this.endPoints.find(endpoint => { return BABYLON.Vector3.Distance(endpoint.localPosition, localPosition) < 0.001; });
        }
        addNeighbour(other) {
            for (let i = 0; i < this.endPoints.length; i++) {
                let thisEndpoint = this.endPoints[i];
                for (let j = 0; j < other.endPoints.length; j++) {
                    let otherEndpoint = other.endPoints[j];
                    if (BABYLON.Vector3.Distance(thisEndpoint.absolutePosition, otherEndpoint.absolutePosition) < 0.002) {
                        thisEndpoint.disconnect();
                        thisEndpoint.connectTo(otherEndpoint);
                    }
                }
            }
            this.neighbours.push(other);
            other.neighbours.push(this);
        }
        removeNeighbour(other) {
            for (let i = 0; i < this.endPoints.length; i++) {
                let thisEndpoint = this.endPoints[i];
                if (thisEndpoint.connectedEndPoint && thisEndpoint.connectedEndPoint.machinePart === other) {
                    thisEndpoint.disconnect();
                }
            }
            this.neighbours.remove(other);
            other.neighbours.remove(this);
        }
        removeAllNeighbours() {
            while (this.neighbours.length > 0) {
                this.removeNeighbour(this.neighbours.get(0));
            }
        }
        get isRightConnected() {
            for (let i = 0; i < this.endPoints.length; i++) {
                let endpoint = this.endPoints[i];
                if (!endpoint.leftSide && endpoint.connectedEndPoint) {
                    return true;
                }
            }
            return false;
        }
        get isUpConnected() {
            for (let i = 0; i < this.endPoints.length; i++) {
                let endpoint = this.endPoints[i];
                if (endpoint.upperSide && endpoint.connectedEndPoint) {
                    return true;
                }
            }
            return false;
        }
        get isDownConnected() {
            for (let i = 0; i < this.endPoints.length; i++) {
                let endpoint = this.endPoints[i];
                if (!endpoint.upperSide && endpoint.connectedEndPoint) {
                    return true;
                }
            }
            return false;
        }
        get isBackConnected() {
            for (let i = 0; i < this.endPoints.length; i++) {
                let endpoint = this.endPoints[i];
                if (!endpoint.farSide && endpoint.connectedEndPoint) {
                    return true;
                }
            }
            return false;
        }
        attachDecor(decor) {
            if (this.decors.indexOf(decor) === -1) {
                this.decors.push(decor);
                decor.detachMachinePart();
                decor.machinePart = this;
            }
        }
        detachDecor(decor) {
            let index = this.decors.indexOf(decor);
            if (index > -1) {
                let decor = this.decors.splice(index, 1)[0];
                decor.machinePart = undefined;
            }
        }
        get l() {
            return this.template.l;
        }
        get w() {
            return this.template.l;
        }
        get h() {
            return this.template.h;
        }
        get d() {
            return this.template.d;
        }
        get n() {
            return this.template.n;
        }
        get s() {
            return this.template.s;
        }
        get mirrorX() {
            return this.template.mirrorX;
        }
        get mirrorZ() {
            return this.template.mirrorZ;
        }
        get lExtendableOnX() {
            return this.template.lExtendableOnX;
        }
        get lExtendableOnXZ() {
            return this.template.lExtendableOnXZ;
        }
        get lExtendableOnZ() {
            return this.template.lExtendableOnZ;
        }
        get hExtendableOnY() {
            return this.template.hExtendableOnY;
        }
        get dExtendableOnZ() {
            return this.template.dExtendableOnZ;
        }
        get extendable() {
            return this.lExtendableOnX || this.lExtendableOnXZ || this.lExtendableOnZ || this.hExtendableOnY || this.dExtendableOnZ;
        }
        get xExtendable() {
            return this.template.xExtendable;
        }
        get yExtendable() {
            return this.template.yExtendable;
        }
        get downwardYExtendable() {
            return this.template.downwardYExtendable;
        }
        get zExtendable() {
            return this.template.zExtendable;
        }
        get nExtendable() {
            return this.template.nExtendable;
        }
        get sExtendable() {
            return this.template.sExtendable;
        }
        get minL() {
            return this.template.minL;
        }
        get maxL() {
            return this.template.maxL;
        }
        get minLAbsolute() {
            return this.template.minLAbsolute;
        }
        get minW() {
            return this.template.minL;
        }
        get maxW() {
            return this.template.maxL;
        }
        get minH() {
            return this.template.minH;
        }
        get maxH() {
            return this.template.maxH;
        }
        get minD() {
            return this.template.minD;
        }
        get maxD() {
            return this.template.maxD;
        }
        get minDAbsolute() {
            return this.template.minDAbsolute;
        }
        get minN() {
            return this.template.minN;
        }
        get maxN() {
            return this.template.maxN;
        }
        get minS() {
            return this.template.minS;
        }
        get maxS() {
            return this.template.maxS;
        }
        get xMirrorable() {
            return this.template.xMirrorable;
        }
        get zMirrorable() {
            return this.template.zMirrorable;
        }
        get hasOriginDestinationHandles() {
            return this.template.hasOriginDestinationHandles;
        }
        getIsNaNOrValidWHD(w, h, d) {
            if (isNaN(w) || w >= this.minW && w <= this.maxW) {
                if (isNaN(h) || h >= this.minH && h <= this.maxH) {
                    if (isNaN(d) || d >= this.minD && d <= this.maxD) {
                        return true;
                    }
                }
            }
            return false;
        }
        get template() {
            return this._template;
        }
        setTemplate(template) {
            this._template = template;
            this.endPoints = [];
            for (let i = 0; i < this._template.endPoints.length; i++) {
                this.endPoints[i] = new MachinePartEndpoint(this._template.endPoints[i], MachinePart.DirectionToRValue(this._template.endPointDirections[i]), this);
                this.endPoints[i].index = i;
            }
        }
        static PropToPartName(prop) {
            return "PropToPartName_NotImplemented";
        }
        get i() {
            return this._i;
        }
        get iAfterUpdate() {
            if (isFinite(this._targetI)) {
                return this._targetI;
            }
            return this._i;
        }
        setI(v, doNotCheckGridLimits) {
            if (this._i != v) {
                this._i = v;
                if (!doNotCheckGridLimits && this.game.mode === MarbleRunSimulatorCore.GameMode.Challenge) {
                    let i = this._i = Nabu.MinMax(this._i, this.game.gridIMin, this.game.gridIMax - (this.w - 1));
                    if (isFinite(i)) {
                        this._i = i;
                    }
                }
                this.position.x = this._i * MarbleRunSimulatorCore.tileSize + this.offsetPosition.x;
                this.freezeWorldMatrix();
                this.getChildMeshes().forEach((m) => {
                    m.freezeWorldMatrix();
                });
                this.update(0);
                this.refreshEncloseMeshAndAABB();
                this.machine.requestUpdateShadow = true;
            }
        }
        setTargetI(v) {
            this._targetI = v;
            this._lastDist = Infinity;
        }
        get j() {
            return this._j;
        }
        get jAfterUpdate() {
            if (isFinite(this._targetJ)) {
                return this._targetJ;
            }
            return this._j;
        }
        setJ(v, doNotCheckGridLimits) {
            if (this._j != v) {
                this._j = v;
                if (!doNotCheckGridLimits && this.game.mode === MarbleRunSimulatorCore.GameMode.Challenge) {
                    let j = this._j = Nabu.MinMax(this._j, this.game.gridJMin, this.game.gridJMax - this.h);
                    if (isFinite(j)) {
                        this._j = j;
                    }
                }
                this.position.z = this._j * MarbleRunSimulatorCore.tileSize + this.offsetPosition.z;
                this.freezeWorldMatrix();
                this.getChildMeshes().forEach((m) => {
                    m.freezeWorldMatrix();
                });
                this.update(0);
                this.refreshEncloseMeshAndAABB();
                this.machine.requestUpdateShadow = true;
            }
        }
        setTargetJ(v) {
            this._targetJ = v;
            this._lastDist = Infinity;
        }
        get k() {
            return this._k;
        }
        get kAfterUpdate() {
            if (isFinite(this._targetK)) {
                return this._targetK;
            }
            return this._k;
        }
        setK(v, doNotCheckGridLimits) {
            if (this._k != v) {
                this._k = v;
                if (!doNotCheckGridLimits && this.game.mode === MarbleRunSimulatorCore.GameMode.Challenge) {
                    let k = Nabu.MinMax(this._k, this.game.gridKMin, this.game.gridKMax - this.h);
                    if (isFinite(k)) {
                        this._k = k;
                    }
                }
                if (!doNotCheckGridLimits) {
                    let k = Math.max(this._k, 0 - this.h, 0);
                    if (isFinite(k)) {
                        this._k = k;
                    }
                }
                this.position.y = this._k * MarbleRunSimulatorCore.tileHeight + this.offsetPosition.y;
                this.freezeWorldMatrix();
                this.getChildMeshes().forEach((m) => {
                    m.freezeWorldMatrix();
                });
                this.update(0);
                this.refreshEncloseMeshAndAABB();
                this.machine.requestUpdateShadow = true;
            }
        }
        setTargetK(v) {
            this._targetK = v;
            this._lastDist = Infinity;
        }
        get r() {
            return this._r;
        }
        get rAfterUpdate() {
            if (isFinite(this._targetR)) {
                return this._targetR;
            }
            return this._r;
        }
        setR(v, doNotCheckGridLimits) {
            if (isFinite(v)) {
                while (v < 0) {
                    v += 4;
                }
                while (v >= 4) {
                    v -= 4;
                }
                if (this._r != v) {
                    this._r = v;
                    if (!doNotCheckGridLimits && this.game.mode === MarbleRunSimulatorCore.GameMode.Challenge) {
                        let r = this._r;
                        if (isFinite(r)) {
                            this._r = r;
                        }
                    }
                    this.rotation.y = -this._r * Math.PI * 0.5;
                    this.freezeWorldMatrix();
                    this.getChildMeshes().forEach((m) => {
                        m.freezeWorldMatrix();
                    });
                    this.update(0);
                    this.machine.requestUpdateShadow = true;
                }
            }
        }
        get targetR() {
            return this._targetR;
        }
        setTargetR(v) {
            while (v < 0) {
                v += 4;
            }
            while (v >= 4) {
                v -= 4;
            }
            this._targetR = v;
            this._lastDist = Infinity;
        }
        static DirectionToRValue(dir) {
            let a = -Mummu.AngleFromToAround(BABYLON.Axis.X, dir, BABYLON.Axis.Y) / (Math.PI * 0.5);
            return Math.round(a + 4) % 4;
        }
        getAbsoluteCoordinatesPosition() {
            return new BABYLON.Vector3(this.i * MarbleRunSimulatorCore.tileSize + this.offsetPosition.x, this.k * MarbleRunSimulatorCore.tileHeight + this.offsetPosition.y, this.j * MarbleRunSimulatorCore.tileSize + this.offsetPosition.z);
        }
        setIsVisible(isVisible) {
            this.isVisible = isVisible;
            this.getChildren(undefined, false).forEach((m) => {
                if (m instanceof BABYLON.Mesh && m.name != "machine-part-selector" && m.name != "enclose-mesh" && !m.name.startsWith("collider-")) {
                    m.isVisible = isVisible;
                }
            });
        }
        get partVisilibityMode() {
            return this._partVisibilityMode;
        }
        set partVisibilityMode(v) {
            this._partVisibilityMode = v;
            if (this._partVisibilityMode === PartVisibilityMode.Default) {
                this.getChildren(undefined, false).forEach((m) => {
                    if (m instanceof BABYLON.Mesh && m.name != "machine-part-selector" && m.name != "enclose-mesh" && !m.name.startsWith("collider-")) {
                        m.visibility = 1;
                    }
                });
            }
            if (this._partVisibilityMode === PartVisibilityMode.Ghost) {
                this.getChildren(undefined, false).forEach((m) => {
                    if (m instanceof BABYLON.Mesh && m.name != "machine-part-selector" && m.name != "enclose-mesh" && !m.name.startsWith("collider-")) {
                        m.visibility = 0.3;
                    }
                });
            }
        }
        get selected() {
            return this._selected;
        }
        select(_multiSelected) {
            this._selected = true;
            this._multiSelected = _multiSelected;
            this.updateSelectorMeshVisibility();
        }
        unselect() {
            this._selected = false;
            this._multiSelected = false;
            this.updateSelectorMeshVisibility();
        }
        hover() {
            this._hovered = true;
            this.updateSelectorMeshVisibility();
        }
        anhover() {
            this._hovered = false;
            this.updateSelectorMeshVisibility();
        }
        updateSelectorMeshVisibility() {
            if (this.selectorBodyDisplay) {
                if (this._selected) {
                    this.selectorBodyDisplay.visibility = 0.2;
                }
                else if (this._hovered) {
                    this.selectorBodyDisplay.visibility = 0.1;
                }
                else {
                    this.selectorBodyDisplay.visibility = 0;
                }
            }
            if (this.encloseMesh) {
                if (this._selected) {
                    this.encloseMesh.visibility = 1;
                }
                else {
                    this.encloseMesh.visibility = 0;
                }
            }
            if (this.gridRectMesh) {
                if (this._selected && !this._multiSelected) {
                    this.gridRectMesh.isVisible = true;
                    this._scene.onBeforeRenderObservable.add(this._alignShadow);
                }
                else {
                    this.gridRectMesh.isVisible = false;
                    this._scene.onBeforeRenderObservable.removeCallback(this._alignShadow);
                    if (this.gridHeightMesh) {
                        this.gridHeightMesh.dispose();
                    }
                }
            }
            this.endPoints.forEach(endpoint => {
                endpoint.updateSelectorMeshVisibility();
            });
        }
        getDirAndUpAtWorldPos(worldPosition) {
            let dir = BABYLON.Vector3.Right();
            let up = BABYLON.Vector3.Up();
            return { dir: dir, up: up };
        }
        getProjection(worldPosition, outProj, outDir, outUp) {
            let localPosition = BABYLON.Vector3.TransformCoordinates(worldPosition, this.getWorldMatrix().clone().invert());
            let bestSqrDist = Infinity;
            let bestTrack;
            let bestPointIndex = -1;
            for (let i = 0; i < this.tracks.length; i++) {
                let track = this.tracks[i];
                for (let j = 0; j < track.templateInterpolatedPoints.length; j++) {
                    let point = track.templateInterpolatedPoints[j];
                    let sqrDist = BABYLON.Vector3.DistanceSquared(localPosition, point);
                    if (sqrDist < bestSqrDist) {
                        bestSqrDist = sqrDist;
                        bestTrack = track;
                        bestPointIndex = j;
                    }
                }
            }
            if (bestTrack) {
                let point = bestTrack.templateInterpolatedPoints[bestPointIndex];
                let normal = bestTrack.trackInterpolatedNormals[bestPointIndex];
                let prev = bestTrack.templateInterpolatedPoints[bestPointIndex - 1];
                let next = bestTrack.templateInterpolatedPoints[bestPointIndex + 1];
                let dir;
                if (prev && next) {
                    dir = next.subtract(prev).normalize();
                }
                else if (prev) {
                    dir = point.subtract(prev).normalize();
                }
                else if (next) {
                    dir = next.subtract(point).normalize();
                }
                if (point && normal && dir) {
                    outProj.copyFrom(point);
                    outUp.copyFrom(normal);
                    outDir.copyFrom(dir);
                    BABYLON.Vector3.TransformCoordinatesToRef(outProj, this.getWorldMatrix(), outProj);
                    BABYLON.Vector3.TransformNormalToRef(outUp, this.getWorldMatrix(), outUp);
                    BABYLON.Vector3.TransformNormalToRef(outDir, this.getWorldMatrix(), outDir);
                }
            }
        }
        getSlopeAt(index, trackIndex = 0) {
            if (this.tracks[trackIndex]) {
                return this.tracks[trackIndex].getSlopeAt(index);
            }
            return 0;
        }
        getBankAt(index, trackIndex = 0) {
            if (this.tracks[trackIndex]) {
                return this.tracks[trackIndex].getBankAt(index);
            }
            return 0;
        }
        getBarycenter() {
            if (this.tracks[0].template.trackpoints.length < 2) {
                return this.position.clone();
            }
            let barycenter = this.tracks[0].template.trackpoints
                .map((trackpoint) => {
                return trackpoint.position;
            })
                .reduce((pos1, pos2) => {
                return pos1.add(pos2);
            })
                .scaleInPlace(1 / this.tracks[0].template.trackpoints.length);
            return BABYLON.Vector3.TransformCoordinates(barycenter, this.getWorldMatrix());
        }
        recomputeAbsolutePath() {
            this.computeWorldMatrix(true);
            this.tracks.forEach((track) => {
                track.recomputeAbsolutePath();
            });
            this.wires.forEach((wire) => {
                wire.recomputeAbsolutePath();
            });
        }
        async instantiate(rebuildNeighboursWireMeshes) {
            this.instantiated = false;
            let selectorHullShapeLogic = [];
            for (let i = 0; i < 6; i++) {
                let a = (i / 6) * 2 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                selectorHullShapeLogic[i] = (new BABYLON.Vector3(cosa * 0.009, sina * 0.009, 0)).scaleInPlace((IsTouchScreen === 1 ? 2 : 1));
            }
            let DEBUG_logicColliderVisibility = 0;
            let selectorMeshDisplayVertexDatas = [];
            let selectorMeshLogicVertexDatas = [];
            this.selectorEndpointsDisplay.forEach(selectorEndpoint => {
                selectorEndpoint.dispose();
            });
            this.selectorEndpointsDisplay = [];
            this.selectorEndpointsLogic.forEach(selectorEndpoint => {
                selectorEndpoint.dispose();
            });
            this.selectorEndpointsLogic = [];
            for (let n = 0; n < this.tracks.length; n++) {
                let points = [...this.tracks[n].templateInterpolatedPoints].map((p) => {
                    return p.clone();
                });
                if (this.tracks[n].template.isPipeOrWood) {
                    let normals = this.tracks[n].trackInterpolatedNormals;
                    points = points.map((pt, i) => {
                        return pt.add(normals[i].scale(0.008));
                    });
                }
                Mummu.DecimatePathInPlace(points, (4 / 180) * Math.PI);
                if (MarbleRunSimulatorCore.Tools.IsWorldPosAConnexion(this.tracks[n].templateInterpolatedPoints[0])) {
                    let endPoint = this.findEndPoint(this.tracks[n].templateInterpolatedPoints[0]);
                    if (endPoint) {
                        let selectorEndpoint = new BABYLON.Mesh("selector-endpoint-start");
                        selectorEndpoint.material = this.game.materials.whiteFullLitMaterial;
                        selectorEndpoint.position = endPoint.localPosition;
                        selectorEndpoint.parent = this;
                        let endpointDisplayVertexData = BABYLON.CreateSphereVertexData({ segments: 12, diameter: 0.018 });
                        endpointDisplayVertexData.applyToMesh(selectorEndpoint);
                        selectorEndpoint.visibility = 0;
                        this.selectorEndpointsDisplay.push(selectorEndpoint);
                        let selectorOriginMeshLogic = new EndpointSelectorMesh(endPoint);
                        selectorOriginMeshLogic.material = this.game.materials.whiteFullLitMaterial;
                        selectorOriginMeshLogic.position = endPoint.localPosition;
                        selectorOriginMeshLogic.parent = this;
                        selectorOriginMeshLogic.visibility = DEBUG_logicColliderVisibility;
                        let endpointLogicVertexData = BABYLON.CreateSphereVertexData({ segments: 12, diameter: 2 * 0.018 });
                        Mummu.ColorizeVertexDataInPlace(endpointLogicVertexData, BABYLON.Color3.Magenta());
                        endpointLogicVertexData.applyToMesh(selectorOriginMeshLogic);
                        this.selectorEndpointsLogic.push(selectorOriginMeshLogic);
                    }
                }
                if (MarbleRunSimulatorCore.Tools.IsWorldPosAConnexion(this.tracks[n].templateInterpolatedPoints[this.tracks[n].templateInterpolatedPoints.length - 1])) {
                    let endPoint = this.findEndPoint(this.tracks[n].templateInterpolatedPoints[this.tracks[n].templateInterpolatedPoints.length - 1]);
                    if (endPoint) {
                        let selectorEndpoint = new BABYLON.Mesh("selector-endpoint-end");
                        selectorEndpoint.material = this.game.materials.whiteFullLitMaterial;
                        selectorEndpoint.position = endPoint.localPosition;
                        selectorEndpoint.parent = this;
                        let endpointDisplayVertexData = BABYLON.CreateSphereVertexData({ segments: 12, diameter: 0.018 });
                        endpointDisplayVertexData.applyToMesh(selectorEndpoint);
                        selectorEndpoint.visibility = 0;
                        this.selectorEndpointsDisplay.push(selectorEndpoint);
                        let selectorEndpointLogicMesh = new EndpointSelectorMesh(endPoint);
                        selectorEndpointLogicMesh.material = this.game.materials.whiteFullLitMaterial;
                        selectorEndpointLogicMesh.position = endPoint.localPosition;
                        selectorEndpointLogicMesh.parent = this;
                        selectorEndpointLogicMesh.visibility = DEBUG_logicColliderVisibility;
                        let endpointLogicVertexData = BABYLON.CreateSphereVertexData({ segments: 12, diameter: 2 * 0.018 });
                        Mummu.ColorizeVertexDataInPlace(endpointLogicVertexData, BABYLON.Color3.Magenta());
                        endpointLogicVertexData.applyToMesh(selectorEndpointLogicMesh);
                        this.selectorEndpointsLogic.push(selectorEndpointLogicMesh);
                    }
                }
                if (points.length >= 2) {
                    let shape = this.tracks[n].template.isPipeOrWood ? selectorHullPipeShapeDisplay : selectorHullShapeDisplay;
                    let dataDisplay = Mummu.CreateExtrudeShapeVertexData({ shape: shape, path: points, closeShape: true, cap: BABYLON.Mesh.CAP_ALL });
                    Mummu.ColorizeVertexDataInPlace(dataDisplay, BABYLON.Color3.FromHexString("#00FFFF"));
                    selectorMeshDisplayVertexDatas.push(dataDisplay);
                    let dataLogic = Mummu.CreateExtrudeShapeVertexData({ shape: selectorHullShapeLogic, path: points, closeShape: true, cap: BABYLON.Mesh.CAP_ALL });
                    Mummu.ColorizeVertexDataInPlace(dataLogic, BABYLON.Color3.FromHexString("#FFFFFF"));
                    selectorMeshLogicVertexDatas.push(dataLogic);
                }
            }
            if (!this.selectorBodyDisplay) {
                this.selectorBodyDisplay = new BABYLON.Mesh("selector-mesh-display-" + this.name);
            }
            this.selectorBodyDisplay.material = this.game.materials.whiteFullLitMaterial;
            this.selectorBodyDisplay.parent = this;
            if (selectorMeshDisplayVertexDatas.length > 0) {
                Mummu.MergeVertexDatas(...selectorMeshDisplayVertexDatas).applyToMesh(this.selectorBodyDisplay);
            }
            this.selectorBodyDisplay.visibility = 0;
            if (this.selectorBodyLogic) {
                this.selectorBodyLogic.dispose();
            }
            this.selectorBodyLogic = new MachinePartSelectorMesh(this);
            this.selectorBodyLogic.material = this.game.materials.whiteFullLitMaterial;
            this.selectorBodyLogic.parent = this;
            if (selectorMeshLogicVertexDatas.length > 0) {
                Mummu.MergeVertexDatas(...selectorMeshLogicVertexDatas).applyToMesh(this.selectorBodyLogic);
            }
            this.selectorBodyLogic.visibility = DEBUG_logicColliderVisibility;
            this.refreshEncloseMeshAndAABB();
            if (this.machine.geometryQ > MarbleRunSimulatorCore.GeometryQuality.Proxy) {
                await this.instantiateMachineSpecific();
            }
            this.rebuildWireMeshes(rebuildNeighboursWireMeshes);
            this.freezeWorldMatrix();
            this.getChildMeshes().forEach((m) => {
                m.freezeWorldMatrix();
            });
            this.machine.requestUpdateShadow = true;
            this.instantiated = true;
        }
        async instantiateMachineSpecific() { }
        refreshEncloseMeshAndAABB() {
            if (this.encloseMesh) {
                this.encloseMesh.dispose();
            }
            if (this.gridRectMesh) {
                this.gridRectMesh.dispose();
            }
            let x0 = -this.wireGauge * 0.5;
            let y0 = -this.wireGauge * 0.5;
            let z0 = -this.wireGauge * 0.5;
            let x1 = this.wireGauge * 0.5;
            let y1 = this.wireGauge * 0.5;
            let z1 = this.wireGauge * 0.5;
            if (this instanceof MarbleRunSimulatorCore.GravityWell) {
                x0 = MarbleRunSimulatorCore.tileWidth * 0.5 - MarbleRunSimulatorCore.tileWidth * 1.2;
                x1 = MarbleRunSimulatorCore.tileWidth * 0.5 + MarbleRunSimulatorCore.tileWidth * 1.2;
                z0 = -MarbleRunSimulatorCore.tileDepth - MarbleRunSimulatorCore.tileWidth * 1.2;
                z1 = -MarbleRunSimulatorCore.tileDepth + MarbleRunSimulatorCore.tileWidth * 1.2;
            }
            for (let i = 0; i < this.tracks.length; i++) {
                let track = this.tracks[i];
                for (let j = 0; j < track.template.trackpoints.length; j++) {
                    let trackpoint = track.template.trackpoints[j];
                    let dx = 0;
                    let dy = this.wireGauge * 0.5;
                    let dz = this.wireGauge * 0.5;
                    if (trackpoint.dir) {
                        if (Math.abs(trackpoint.dir.y) > 0.5) {
                            dx = this.wireGauge * 0.5;
                            dy = this.wireGauge * 0.5;
                            dz = this.wireGauge * 0.5;
                        }
                        if (Math.abs(trackpoint.dir.z) > Math.abs(trackpoint.dir.x)) {
                            dx = this.wireGauge * 0.5;
                            dz = 0;
                        }
                    }
                    let tX0 = trackpoint.position.x - dx;
                    x0 = Math.min(tX0, x0);
                    let tX1 = trackpoint.position.x + dx;
                    x1 = Math.max(tX1, x1);
                    let tY0 = trackpoint.position.y - dy;
                    y0 = Math.min(tY0, y0);
                    let tY1 = trackpoint.position.y + dy;
                    y1 = Math.max(tY1, y1);
                    let tZ0 = trackpoint.position.z - dz;
                    z0 = Math.min(tZ0, z0);
                    let tZ1 = trackpoint.position.z + dz;
                    z1 = Math.max(tZ1, z1);
                }
            }
            x0 = Math.round((x0 - MarbleRunSimulatorCore.tileSize * 0.5) / MarbleRunSimulatorCore.tileSize) * MarbleRunSimulatorCore.tileSize + MarbleRunSimulatorCore.tileSize * 0.5;
            x1 = Math.round((x1 + MarbleRunSimulatorCore.tileSize * 0.5) / MarbleRunSimulatorCore.tileSize) * MarbleRunSimulatorCore.tileSize - MarbleRunSimulatorCore.tileSize * 0.5;
            y0 = Math.round((y0 - MarbleRunSimulatorCore.tileHeight * 0.5) / MarbleRunSimulatorCore.tileHeight) * MarbleRunSimulatorCore.tileHeight + MarbleRunSimulatorCore.tileHeight * 0.5;
            y1 = Math.round((y1 + MarbleRunSimulatorCore.tileHeight * 0.5) / MarbleRunSimulatorCore.tileHeight) * MarbleRunSimulatorCore.tileHeight - MarbleRunSimulatorCore.tileHeight * 0.5;
            z0 = Math.round((z0 - MarbleRunSimulatorCore.tileSize * 0.5) / MarbleRunSimulatorCore.tileSize) * MarbleRunSimulatorCore.tileSize + MarbleRunSimulatorCore.tileSize * 0.5;
            z1 = Math.round((z1 + MarbleRunSimulatorCore.tileSize * 0.5) / MarbleRunSimulatorCore.tileSize) * MarbleRunSimulatorCore.tileSize - MarbleRunSimulatorCore.tileSize * 0.5;
            this.encloseStart.copyFromFloats(x0, y0, z0);
            this.encloseEnd.copyFromFloats(x1, y1, z1);
            this.enclose13
                .copyFrom(this.encloseStart)
                .scaleInPlace(2 / 3)
                .addInPlace(this.encloseEnd.scale(1 / 3));
            this.encloseMid.copyFrom(this.encloseStart).addInPlace(this.encloseEnd).scaleInPlace(0.5);
            this.enclose23
                .copyFrom(this.encloseStart)
                .scaleInPlace(1 / 3)
                .addInPlace(this.encloseEnd.scale(2 / 3));
            this.encloseMesh = new BABYLON.Mesh("enclose-mesh");
            let encloseMeshVertexData = MarbleRunSimulatorCore.Tools.Box9SliceVertexData(this.encloseStart, this.encloseEnd, 0.001);
            encloseMeshVertexData.applyToMesh(this.encloseMesh);
            this.encloseMesh.material = this.game.materials.slice9Cutoff;
            this.encloseMesh.parent = this;
            this.encloseMesh.visibility = 0;
            this.gridRectMesh = new BABYLON.Mesh("grid-rect-mesh");
            let points = [
                new BABYLON.Vector3(x0, 0, z0),
                new BABYLON.Vector3(x0, 0, z1),
                new BABYLON.Vector3(x1, 0, z1),
                new BABYLON.Vector3(x1, 0, z0),
            ];
            points = Mummu.BevelClosedPath(points, 0.001);
            points = Mummu.BevelClosedPath(points, 0.0003);
            let gridRectVertexData = Mummu.CreateWireVertexData({ path: points, radius: 0.0005, closed: true });
            gridRectVertexData.applyToMesh(this.gridRectMesh);
            this.gridRectMesh.material = this.game.materials.whiteFullLitMaterial;
            this.gridRectMesh.isVisible = false;
            this.AABBMin.copyFromFloats(this.encloseStart.x, this.encloseStart.y, this.encloseStart.z);
            this.AABBMax.copyFromFloats(this.encloseEnd.x, this.encloseEnd.y, this.encloseEnd.z);
            if (this.tracks[0] && this.tracks[0].template.isWood) {
                this.AABBMax.y += MarbleRunSimulatorCore.tileSize;
            }
            this.visibleWidth = Math.round((this.AABBMax.x - this.AABBMin.x) / MarbleRunSimulatorCore.tileSize);
            this.visibleHeight = Math.round((this.AABBMax.y - this.AABBMin.y) / MarbleRunSimulatorCore.tileHeight);
            this.visibleDepth = Math.round((this.AABBMax.z - this.AABBMin.z) / MarbleRunSimulatorCore.tileSize);
            this.localBarycenter = new BABYLON.Vector3((this.AABBMax.x + this.AABBMin.x) * 0.5, (this.AABBMax.y + this.AABBMin.y) * 0.5, (this.AABBMax.z + this.AABBMin.z) * 0.5);
            //let localBarycenterDebug = Mummu.DrawDebugPoint(this.localBarycenter, Infinity, BABYLON.Color3.Green(), 0.02);
            //localBarycenterDebug.parent = this;
            if (this.visibleWidth % 2 === 0) {
                this.localBarycenterIJK.x = Math.floor(this.localBarycenter.x / MarbleRunSimulatorCore.tileSize);
            }
            else {
                this.localBarycenterIJK.x = Math.round(this.localBarycenter.x / MarbleRunSimulatorCore.tileSize);
            }
            this.localBarycenterIJK.y = Math.round(this.localBarycenter.y / MarbleRunSimulatorCore.tileHeight);
            if (this.visibleDepth % 2 === 0) {
                this.localBarycenterIJK.z = Math.ceil(this.localBarycenter.z / MarbleRunSimulatorCore.tileSize);
            }
            else {
                this.localBarycenterIJK.z = Math.round(this.localBarycenter.z / MarbleRunSimulatorCore.tileSize);
            }
            //let localBarycenterIJKDebug = Mummu.DrawDebugPoint(this.localBarycenterIJK.multiplyByFloats(tileSize, tileHeight, tileSize), Infinity, BABYLON.Color3.Blue(), 0.02);
            //localBarycenterIJKDebug.parent = this;
            let aabb1 = BABYLON.Vector3.TransformCoordinates(this.AABBMin, this.getWorldMatrix());
            let aabb2 = BABYLON.Vector3.TransformCoordinates(this.AABBMax, this.getWorldMatrix());
            this.AABBMin = BABYLON.Vector3.Minimize(aabb1, aabb2);
            this.AABBMax = BABYLON.Vector3.Maximize(aabb1, aabb2);
            this.machine.requestUpdateBaseMesh = true;
        }
        dispose() {
            this.endPoints.forEach(endpoint => {
                endpoint.hideHelperMesh();
            });
            super.dispose();
            this.removeAllNeighbours();
            let index = this.machine.parts.indexOf(this);
            if (index > -1) {
                this.machine.parts.splice(index, 1);
            }
        }
        generateWires() {
            this.allWires = [...this.wires];
            if (this.template) {
                for (let i = 0; i < this.template.trackTemplates.length; i++) {
                    let track = this.tracks[i];
                    if (!track) {
                        if (this.template.trackTemplates[i].isPipe) {
                            track = new MarbleRunSimulatorCore.PipeTrack(this);
                        }
                        else if (this.template.trackTemplates[i].isWood) {
                            track = new MarbleRunSimulatorCore.WoodTrack(this);
                        }
                        else {
                            track = new MarbleRunSimulatorCore.Track(this);
                        }
                        this.tracks[i] = track;
                    }
                    track.initialize(this.template.trackTemplates[i]);
                    this.allWires.push(track.wires[0], track.wires[1]);
                }
            }
            else {
                console.error("Can't generate wires, no template provided for " + this.partName);
                console.log(this);
            }
        }
        updateTargetCoordinates(dt) {
            if (this.instantiated && isFinite(this._targetI) || isFinite(this._targetJ) || isFinite(this._targetK) || isFinite(this._targetR)) {
                let f = Nabu.Easing.smoothNSec(1 / dt, 0.1);
                let tI = isFinite(this._targetI) ? this._targetI : this.i;
                let tJ = isFinite(this._targetJ) ? this._targetJ : this.j;
                let tK = isFinite(this._targetK) ? this._targetK : this.k;
                let tR = isFinite(this._targetR) ? this._targetR : this.r;
                let targetPosition = new BABYLON.Vector3(tI * MarbleRunSimulatorCore.tileSize + this.offsetPosition.x, tK * MarbleRunSimulatorCore.tileHeight + this.offsetPosition.y, tJ * MarbleRunSimulatorCore.tileSize + this.offsetPosition.z);
                let targetRotationY = -tR * Math.PI * 0.5;
                let dist = BABYLON.Vector3.Distance(this.position, targetPosition) + Math.abs(Nabu.AngularDistance(this.rotation.y, targetRotationY));
                if (dist < 0.0001 || dist > this._lastDist) {
                    this.position.copyFrom(targetPosition);
                    this.rotation.y = targetRotationY;
                    this._i = tI;
                    this._j = tJ;
                    this._k = tK;
                    this._r = tR;
                    this._targetI = undefined;
                    this._targetJ = undefined;
                    this._targetK = undefined;
                    this._targetR = undefined;
                    this.targetUpdatePivot = undefined;
                    this.instantiate(true).then(() => {
                        this.refreshEncloseMeshAndAABB();
                        this.updateSelectorMeshVisibility();
                        this.machine.requestUpdateBaseMesh = true;
                        this.machine.requestUpdateShadow = true;
                    });
                }
                else {
                    if (this.targetUpdatePivot) {
                        let v0 = this.position.subtract(this.targetUpdatePivot);
                        let y0 = v0.y;
                        v0.y = 0;
                        let l0 = v0.length();
                        v0.scaleInPlace(1 / l0);
                        let v1 = targetPosition.subtract(this.targetUpdatePivot);
                        let y1 = v1.y;
                        v1.y = 0;
                        let l1 = v1.length();
                        v1.scaleInPlace(1 / l1);
                        let v = BABYLON.Vector3.One();
                        BABYLON.Vector3.SlerpToRef(v0, v1, 1 - f, v);
                        let l = l0 * f + l1 * (1 - f);
                        v.normalize().scaleInPlace(l);
                        v.y = y0 * f + y1 * (1 - f);
                        ;
                        this.position.copyFrom(v).addInPlace(this.targetUpdatePivot);
                    }
                    else {
                        BABYLON.Vector3.LerpToRef(this.position, targetPosition, 1 - f, this.position);
                    }
                    this.rotation.y = Nabu.LerpAngle(this.rotation.y, targetRotationY, 1 - f);
                }
                this._lastDist = dist;
                this.freezeWorldMatrix();
                this.getChildMeshes().forEach((m) => {
                    m.freezeWorldMatrix();
                });
                return true;
            }
            return false;
        }
        update(dt) {
        }
        rebuildWireMeshes(rebuildNeighboursWireMeshes) {
            let neighboursToUpdate;
            if (rebuildNeighboursWireMeshes) {
                neighboursToUpdate = this.neighbours.cloneAsArray();
                for (let i = 0; i < neighboursToUpdate.length; i++) {
                    neighboursToUpdate[i].rebuildWireMeshes();
                }
            }
            this.allWires.forEach((wire) => {
                wire.show();
            });
            this.removeAllNeighbours();
            this.tracks.forEach((track) => {
                track.recomputeWiresPath();
                track.recomputeAbsolutePath();
                if (track instanceof MarbleRunSimulatorCore.PipeTrack) {
                    MarbleRunSimulatorCore.PipeTrackMeshBuilder.BuildPipeTrackMesh(track, {});
                }
                else if (track instanceof MarbleRunSimulatorCore.WoodTrack) {
                    MarbleRunSimulatorCore.WoodTrackMeshBuilder.BuildWoodTrackMesh(track, {});
                }
                else {
                    track.wires.forEach((wire) => {
                        wire.instantiate(isFinite(wire.colorIndex) ? this.getColor(wire.colorIndex) : this.getColor(track.template.colorIndex));
                    });
                }
            });
            this.wires.forEach((wire) => {
                wire.instantiate(isFinite(wire.colorIndex) ? this.getColor(wire.colorIndex) : this.getColor(0));
            });
            requestAnimationFrame(() => {
                this.doSleepersMeshUpdate();
            });
            if (rebuildNeighboursWireMeshes) {
                neighboursToUpdate = this.neighbours.cloneAsArray();
                for (let i = 0; i < neighboursToUpdate.length; i++) {
                    neighboursToUpdate[i].rebuildWireMeshes();
                }
            }
            this.freezeWorldMatrix();
            this.machine.requestUpdateShadow = true;
        }
        doSleepersMeshUpdate() {
            if (!this.instantiated || this.isDisposed()) {
                return;
            }
            let datas = MarbleRunSimulatorCore.SleeperMeshBuilder.GenerateSleepersVertexData(this, this.sleepersMeshProp);
            datas.forEach((vData, colorIndex) => {
                if (!this.sleepersMeshes.get(colorIndex)) {
                    let sleeperMesh = new BABYLON.Mesh("sleeper-mesh-" + colorIndex);
                    sleeperMesh.parent = this;
                    this.sleepersMeshes.set(colorIndex, sleeperMesh);
                }
                let sleeperMesh = this.sleepersMeshes.get(colorIndex);
                sleeperMesh.material = this.game.materials.getMaterial(colorIndex, this.machine.materialQ);
                vData.applyToMesh(sleeperMesh);
                sleeperMesh.freezeWorldMatrix();
            });
            this.machine.requestUpdateShadow = true;
            if (this.game.DEBUG_MODE) {
            }
        }
        getTriCount() {
            let triCount = this.getIndices().length / 3;
            let children = this.getChildMeshes();
            children.forEach((child) => {
                triCount += child.getIndices().length / 3;
            });
            return triCount;
        }
    }
    MarbleRunSimulatorCore.MachinePart = MachinePart;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    // Caution, order is important. Do not rearrange.
    MarbleRunSimulatorCore.TrackNames = [
        "ramp_1.1.1",
        "wave_2.1.1",
        "snake_2.1.1",
        "join",
        "flatjoin",
        "split",
        "uturn_2.0",
        "wall_3.3",
        "uturnsharp_1",
        "loop_2.2.1",
        "spiral_1.2",
        "elevator_4",
        "stairway_2.4",
        "screw_2.2",
        "start",
        "end",
        "jumper_1",
        "gravitywell",
        "shooter_8",
        "controller",
        "screen",
        "speeder",
        "forwardSplit",
        "spiralUTurn_3.2",
        "piperamp_1.1.1",
        "pipeuturn_2.0",
        "steamelevator_4",
        "sort",
        "spawner",
        "woodramp_1.1.1",
        "wooduturn_2.0",
        "uturnv2_0.2",
        "curb_2.0",
        "rampv2_1.1.1",
        "multiJoin_1",
        "trikeSkull",
    ];
    class MachinePartFactory {
        constructor(machine) {
            this.machine = machine;
        }
        createTrackWHDN(trackname, props) {
            if (!props) {
                props = {};
            }
            props.fullPartName = trackname; // hacky but work
            trackname = trackname.split("_")[0];
            console.log("createTrackWHDN " + trackname);
            return this.createTrack(trackname, props);
        }
        createTrack(partName, prop) {
            if (partName.indexOf("_X") != -1) {
                prop.mirrorX = true;
                partName = partName.replace("_X", "");
            }
            if (partName.indexOf("_Z") != -1) {
                prop.mirrorZ = true;
                partName = partName.replace("_Z", "");
            }
            if (partName === "ramp" || partName.startsWith("ramp_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let d = parseInt(argStr.split(".")[2]);
                    let s = parseInt(argStr.split(".")[3]);
                    prop.l = w;
                    prop.h = h;
                    prop.d = d;
                    if (isFinite(s)) {
                        prop.s = s;
                    }
                }
                if (isNaN(prop.s)) {
                    prop.s = MarbleRunSimulatorCore.TrackSpeed.Medium;
                }
                return new MarbleRunSimulatorCore.Ramp(this.machine, prop);
            }
            if (partName === "rampv2" || partName.startsWith("rampv2_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let d = parseInt(argStr.split(".")[2]);
                    prop.l = w;
                    prop.h = h;
                    prop.d = d;
                }
                return new MarbleRunSimulatorCore.Ramp(this.machine, prop);
            }
            if (partName === "piperamp" || partName.startsWith("piperamp_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let d = parseInt(argStr.split(".")[2]);
                    prop.l = w;
                    prop.h = h;
                    prop.d = d;
                }
                prop.pipeVersion = true;
                return new MarbleRunSimulatorCore.Ramp(this.machine, prop);
            }
            if (partName === "woodramp" || partName.startsWith("woodramp_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let d = parseInt(argStr.split(".")[2]);
                    prop.l = w;
                    prop.h = h;
                    prop.d = d;
                }
                prop.woodVersion = true;
                return new MarbleRunSimulatorCore.Ramp(this.machine, prop);
            }
            if (partName === "wave" || partName.startsWith("wave_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let d = parseInt(argStr.split(".")[2]);
                    prop.l = w;
                    prop.h = h;
                    prop.d = d;
                }
                return new MarbleRunSimulatorCore.Wave(this.machine, prop);
            }
            if (partName === "snake" || partName.startsWith("snake_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let s = parseInt(argStr.split(".")[1]);
                    prop.l = w;
                    if (isFinite(s)) {
                        prop.s = s;
                    }
                }
                return new MarbleRunSimulatorCore.Snake(this.machine, prop);
            }
            if (partName === "curb" || partName.startsWith("curb_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let s = parseInt(argStr.split(".")[2]);
                    prop.l = l;
                    prop.h = h;
                    if (isFinite(s)) {
                        prop.s = s;
                    }
                }
                if (isNaN(prop.s)) {
                    prop.s = MarbleRunSimulatorCore.TrackSpeed.Medium;
                }
                return new MarbleRunSimulatorCore.Curb(this.machine, prop);
            }
            if (partName === "uturn" || partName.startsWith("uturn_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let s = parseInt(argStr.split(".")[2]);
                    prop.l = l;
                    prop.h = h;
                    if (isFinite(s)) {
                        prop.s = s;
                    }
                }
                if (isNaN(prop.s)) {
                    prop.s = MarbleRunSimulatorCore.TrackSpeed.Medium;
                }
                return new MarbleRunSimulatorCore.UTurn(this.machine, prop);
            }
            if (partName === "uturnv2" || partName.startsWith("uturnv2_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let s = parseInt(argStr.split(".")[2]);
                    prop.l = l;
                    prop.h = h;
                    if (isFinite(s)) {
                        prop.s = s;
                    }
                }
                if (isNaN(prop.s)) {
                    prop.s = MarbleRunSimulatorCore.TrackSpeed.Medium;
                }
                return new MarbleRunSimulatorCore.UTurnV2(this.machine, prop);
            }
            if (partName === "pipeuturn" || partName.startsWith("pipeuturn_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = l;
                    prop.h = h;
                }
                prop.pipeVersion = true;
                return new MarbleRunSimulatorCore.UTurn(this.machine, prop);
            }
            if (partName === "wooduturn" || partName.startsWith("wooduturn_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let h = parseInt(argStr.split(".")[0]);
                    let d = parseInt(argStr.split(".")[1]);
                    prop.h = h;
                    prop.d = d;
                }
                prop.woodVersion = true;
                return new MarbleRunSimulatorCore.UTurn(this.machine, prop);
            }
            if (partName === "wall" || partName.startsWith("wall_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = l;
                    prop.h = h;
                }
                return new MarbleRunSimulatorCore.Wall(this.machine, prop);
            }
            if (partName === "uturnsharp" || partName.startsWith("uturnsharp_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let h = parseInt(argStr.split(".")[0]);
                    prop.h = h;
                }
                return new MarbleRunSimulatorCore.UTurnSharp(this.machine, prop);
            }
            if (partName === "start") {
                return new MarbleRunSimulatorCore.Start(this.machine, prop);
            }
            if (partName === "end") {
                return new MarbleRunSimulatorCore.End(this.machine, prop);
            }
            if (partName === "jumper" || partName.startsWith("jumper_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let n = parseInt(argStr.split(".")[0]);
                    prop.n = n;
                }
                return new MarbleRunSimulatorCore.Jumper(this.machine, prop);
            }
            if (partName === "gravitywell") {
                return new MarbleRunSimulatorCore.GravityWell(this.machine, prop);
            }
            if (partName === "loop" || partName.startsWith("loop_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let d = parseInt(argStr.split(".")[1]);
                    let n = parseInt(argStr.split(".")[2]);
                    prop.l = w;
                    prop.d = d;
                    prop.n = n;
                }
                return new MarbleRunSimulatorCore.Loop(this.machine, prop);
            }
            if (partName === "spiral" || partName.startsWith("spiral_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = w;
                    prop.h = h;
                }
                return new MarbleRunSimulatorCore.Spiral(this.machine, prop);
            }
            if (partName === "spiralUTurn" || partName.startsWith("spiralUTurn_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = l;
                    prop.h = h;
                }
                return new MarbleRunSimulatorCore.SpiralUTurn(this.machine, prop);
            }
            if (partName === "join") {
                return new MarbleRunSimulatorCore.Join(this.machine, prop);
            }
            if (partName === "flatjoin") {
                return new MarbleRunSimulatorCore.FlatJoin(this.machine, prop);
            }
            if (partName === "multiJoin" || partName.startsWith("multiJoin_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    prop.l = l;
                }
                return new MarbleRunSimulatorCore.MultiJoin(this.machine, prop);
            }
            if (partName === "split") {
                return new MarbleRunSimulatorCore.Split(this.machine, prop);
            }
            if (partName === "forwardSplit") {
                return new MarbleRunSimulatorCore.ForwardSplit(this.machine, prop);
            }
            if (partName === "sort") {
                return new MarbleRunSimulatorCore.Sort(this.machine, prop);
            }
            if (partName === "controller") {
                return new MarbleRunSimulatorCore.Controller(this.machine, prop);
            }
            if (partName === "spawner") {
                return new MarbleRunSimulatorCore.Spawner(this.machine, prop);
            }
            if (partName === "elevator" || partName.startsWith("elevator_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let h = parseInt(argStr);
                    prop.h = h;
                }
                return new MarbleRunSimulatorCore.Elevator(this.machine, prop);
            }
            if (partName === "steamelevator" || partName.startsWith("steamelevator_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let h = parseInt(argStr);
                    prop.h = h;
                }
                return new MarbleRunSimulatorCore.SteamElevator(this.machine, prop);
            }
            if (partName === "shooter" || partName.startsWith("shooter_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let h = parseInt(argStr.split(".")[0]);
                    let n = parseInt(argStr.split(".")[1]);
                    prop.h = h;
                    prop.n = n;
                }
                return new MarbleRunSimulatorCore.Shooter(this.machine, prop);
            }
            if (partName === "stairway" || partName.startsWith("stairway_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = w;
                    prop.h = h;
                }
                return new MarbleRunSimulatorCore.Stairway(this.machine, prop);
            }
            if (partName === "screw" || partName.startsWith("screw_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = w;
                    prop.h = h;
                }
                return new MarbleRunSimulatorCore.Screw(this.machine, prop);
            }
            if (partName === "quarter") {
                return new MarbleRunSimulatorCore.QuarterNote(this.machine, prop);
            }
            if (partName === "double") {
                return new MarbleRunSimulatorCore.DoubleNote(this.machine, prop);
            }
            if (partName === "screen") {
                return new MarbleRunSimulatorCore.Screen(this.machine, prop);
            }
            if (partName === "speeder" || partName.startsWith("speeder_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    prop.l = l;
                }
                return new MarbleRunSimulatorCore.Speeder(this.machine, prop);
            }
            if (partName === "trikeSkull") {
                return new MarbleRunSimulatorCore.TrikeSkull(this.machine, prop);
            }
        }
        createTrackBaseName(baseName, prop) {
            if (isNaN(prop.s)) {
                prop.s = MarbleRunSimulatorCore.TrackSpeed.Medium;
            }
            if (baseName === "ramp") {
                return new MarbleRunSimulatorCore.Ramp(this.machine, prop);
            }
            if (baseName === "rampv2") {
                return new MarbleRunSimulatorCore.Ramp(this.machine, prop);
            }
            if (baseName === "piperamp") {
                prop.pipeVersion = true;
                return new MarbleRunSimulatorCore.Ramp(this.machine, prop);
            }
            if (baseName === "woodramp") {
                prop.woodVersion = true;
                return new MarbleRunSimulatorCore.Ramp(this.machine, prop);
            }
            if (baseName === "wave") {
                return new MarbleRunSimulatorCore.Wave(this.machine, prop);
            }
            if (baseName === "snake") {
                return new MarbleRunSimulatorCore.Snake(this.machine, prop);
            }
            if (baseName === "curb") {
                return new MarbleRunSimulatorCore.Curb(this.machine, prop);
            }
            if (baseName === "uturn") {
                return new MarbleRunSimulatorCore.UTurn(this.machine, prop);
            }
            if (baseName === "pipeuturn") {
                prop.pipeVersion = true;
                return new MarbleRunSimulatorCore.UTurn(this.machine, prop);
            }
            if (baseName === "wooduturn") {
                prop.woodVersion = true;
                return new MarbleRunSimulatorCore.UTurn(this.machine, prop);
            }
            if (baseName === "wall") {
                return new MarbleRunSimulatorCore.Wall(this.machine, prop);
            }
            if (baseName === "uturnsharp") {
                return new MarbleRunSimulatorCore.UTurnSharp(this.machine, prop);
            }
            if (baseName === "start") {
                return new MarbleRunSimulatorCore.Start(this.machine, prop);
            }
            if (baseName === "end") {
                return new MarbleRunSimulatorCore.End(this.machine, prop);
            }
            if (baseName === "jumper") {
                return new MarbleRunSimulatorCore.Jumper(this.machine, prop);
            }
            if (baseName === "gravitywell") {
                return new MarbleRunSimulatorCore.GravityWell(this.machine, prop);
            }
            if (baseName === "loop") {
                return new MarbleRunSimulatorCore.Loop(this.machine, prop);
            }
            if (baseName === "spiral") {
                return new MarbleRunSimulatorCore.Spiral(this.machine, prop);
            }
            if (baseName === "spiralUTurn") {
                return new MarbleRunSimulatorCore.SpiralUTurn(this.machine, prop);
            }
            if (baseName === "join") {
                return new MarbleRunSimulatorCore.Join(this.machine, prop);
            }
            if (baseName === "multiJoin") {
                return new MarbleRunSimulatorCore.MultiJoin(this.machine, prop);
            }
            if (baseName === "flatjoin") {
                return new MarbleRunSimulatorCore.FlatJoin(this.machine, prop);
            }
            if (baseName === "split") {
                return new MarbleRunSimulatorCore.Split(this.machine, prop);
            }
            if (baseName === "forwardSplit") {
                return new MarbleRunSimulatorCore.ForwardSplit(this.machine, prop);
            }
            if (baseName === "sort") {
                return new MarbleRunSimulatorCore.Sort(this.machine, prop);
            }
            if (baseName === "controller") {
                return new MarbleRunSimulatorCore.Controller(this.machine, prop);
            }
            if (baseName === "spawner") {
                return new MarbleRunSimulatorCore.Spawner(this.machine, prop);
            }
            if (baseName === "elevator") {
                return new MarbleRunSimulatorCore.Elevator(this.machine, prop);
            }
            if (baseName === "steamelevator") {
                return new MarbleRunSimulatorCore.SteamElevator(this.machine, prop);
            }
            if (baseName === "shooter") {
                return new MarbleRunSimulatorCore.Shooter(this.machine, prop);
            }
            if (baseName === "stairway") {
                return new MarbleRunSimulatorCore.Stairway(this.machine, prop);
            }
            if (baseName === "screw") {
                return new MarbleRunSimulatorCore.Screw(this.machine, prop);
            }
            if (baseName === "quarter") {
                return new MarbleRunSimulatorCore.QuarterNote(this.machine, prop);
            }
            if (baseName === "double") {
                return new MarbleRunSimulatorCore.DoubleNote(this.machine, prop);
            }
            if (baseName === "screen") {
                return new MarbleRunSimulatorCore.Screen(this.machine, prop);
            }
            if (baseName === "speeder") {
                return new MarbleRunSimulatorCore.Speeder(this.machine, prop);
            }
            if (baseName === "trikeSkull") {
                return new MarbleRunSimulatorCore.TrikeSkull(this.machine, prop);
            }
        }
    }
    MarbleRunSimulatorCore.MachinePartFactory = MachinePartFactory;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Track {
        constructor(part) {
            this.part = part;
            this._startWorldPosition = BABYLON.Vector3.Zero();
            this._endWorldPosition = BABYLON.Vector3.Zero();
            this.AABBMin = BABYLON.Vector3.Zero();
            this.AABBMax = BABYLON.Vector3.Zero();
            this.wires = [new MarbleRunSimulatorCore.Wire(this.part), new MarbleRunSimulatorCore.Wire(this.part)];
        }
        get templateInterpolatedPoints() {
            return this.template.interpolatedPoints;
        }
        get preferedStartBank() {
            if (this.template && isFinite(this.template.forcedAngle)) {
                return this.template.forcedAngle;
            }
            return this.template ? this.template.preferedStartBank : 0;
        }
        get startWorldPosition() {
            BABYLON.Vector3.TransformCoordinatesToRef(this.templateInterpolatedPoints[0], this.part.getWorldMatrix(), this._startWorldPosition);
            return this._startWorldPosition;
        }
        get preferedEndBank() {
            if (this.template && isFinite(this.template.forcedAngle)) {
                return this.template.forcedAngle;
            }
            return this.template ? this.template.preferedEndBank : 0;
        }
        get endWorldPosition() {
            BABYLON.Vector3.TransformCoordinatesToRef(this.templateInterpolatedPoints[this.templateInterpolatedPoints.length - 1], this.part.getWorldMatrix(), this._endWorldPosition);
            return this._endWorldPosition;
        }
        get trackIndex() {
            return this.part.tracks.indexOf(this);
        }
        getSlopeAt(index) {
            let trackpoint = this.template.trackpoints[index];
            let nextTrackPoint = this.template.trackpoints[index + 1];
            if (trackpoint) {
                if (nextTrackPoint) {
                    let dy = nextTrackPoint.position.y - trackpoint.position.y;
                    let dLength = nextTrackPoint.summedLength - trackpoint.summedLength;
                    return (dy / dLength) * 100;
                }
                else {
                    let angleToVertical = Mummu.Angle(BABYLON.Axis.Y, trackpoint.dir);
                    let angleToHorizontal = Math.PI / 2 - angleToVertical;
                    return Math.tan(angleToHorizontal) * 100;
                }
            }
            return 0;
        }
        getBankAt(index) {
            let trackpoint = this.template.trackpoints[index];
            if (trackpoint) {
                let n = trackpoint.normal;
                if (n.y < 0) {
                    n = n.scale(-1);
                }
                let angle = Mummu.AngleFromToAround(trackpoint.normal, BABYLON.Axis.Y, trackpoint.dir);
                return (angle / Math.PI) * 180;
            }
            return 0;
        }
        initialize(template) {
            this.template = template;
            this.trackInterpolatedNormals = template.interpolatedNormals.map((v) => {
                return v.clone();
            });
            // Update AABB values.
            let N = this.templateInterpolatedPoints.length;
            this.AABBMin.copyFromFloats(Infinity, Infinity, Infinity);
            this.AABBMax.copyFromFloats(-Infinity, -Infinity, -Infinity);
            for (let i = 0; i < N; i++) {
                let p = this.templateInterpolatedPoints[i];
                this.AABBMin.minimizeInPlace(p);
                this.AABBMax.maximizeInPlace(p);
            }
            this.AABBMin.x -= (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMin.y -= (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMin.z -= (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMax.x += (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMax.y += (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMax.z += (this.part.wireSize + this.part.wireGauge) * 0.5;
            BABYLON.Vector3.TransformCoordinatesToRef(this.AABBMin, this.part.getWorldMatrix(), this.AABBMin);
            BABYLON.Vector3.TransformCoordinatesToRef(this.AABBMax, this.part.getWorldMatrix(), this.AABBMax);
        }
        recomputeWiresPath(forceDisconnexion) {
            let N = this.templateInterpolatedPoints.length;
            let angles = [...this.template.angles];
            this.trackInterpolatedNormals = this.template.interpolatedNormals.map((v) => {
                return v.clone();
            });
            let startBank = this.preferedStartBank;
            if (!forceDisconnexion) {
                let otherS = this.part.machine.getBankAt(this.startWorldPosition, this.part);
                if (otherS) {
                    this.part.addNeighbour(otherS.part);
                    if (otherS.pipeTrack) {
                        startBank = 0;
                    }
                    else {
                        let otherBank = otherS.bank * (otherS.isEnd ? 1 : -1);
                        if (this.preferedStartBank * otherBank >= 0) {
                            startBank = Math.sign(this.preferedStartBank + otherBank) * Math.max(Math.abs(this.preferedStartBank), Math.abs(otherBank));
                        }
                        else {
                            startBank = this.preferedStartBank * 0.5 + otherBank * 0.5;
                        }
                        let maxBank = Math.min(this.template.partTemplate.maxAngle, otherS.part.template.maxAngle);
                        if (Math.abs(startBank) > maxBank) {
                            startBank = Math.sign(startBank) * maxBank;
                        }
                    }
                }
            }
            let endBank = this.preferedEndBank;
            if (!forceDisconnexion) {
                let otherE = this.part.machine.getBankAt(this.endWorldPosition, this.part);
                if (otherE) {
                    this.part.addNeighbour(otherE.part);
                    if (otherE.pipeTrack) {
                        endBank = 0;
                    }
                    else {
                        let otherBank = otherE.bank * (otherE.isEnd ? -1 : 1);
                        if (this.preferedEndBank * otherBank >= 0) {
                            endBank = Math.sign(this.preferedEndBank + otherBank) * Math.max(Math.abs(this.preferedEndBank), Math.abs(otherBank));
                        }
                        else {
                            endBank = this.preferedEndBank * 0.5 + otherBank * 0.5;
                        }
                        let maxBank = Math.min(this.template.partTemplate.maxAngle, otherE.part.template.maxAngle);
                        if (Math.abs(endBank) > maxBank) {
                            endBank = Math.sign(endBank) * maxBank;
                        }
                    }
                }
            }
            angles[0] = startBank;
            angles[angles.length - 1] = endBank;
            let distancesFromStart = this.templateInterpolatedPoints.map((v) => { return 0; });
            for (let i = 1; i < this.templateInterpolatedPoints.length; i++) {
                let p0 = this.templateInterpolatedPoints[i - 1];
                let p1 = this.templateInterpolatedPoints[i];
                let d = BABYLON.Vector3.Distance(p0, p1);
                distancesFromStart[i] = distancesFromStart[i - 1] + d;
            }
            let totalLength = distancesFromStart[distancesFromStart.length - 1];
            let smoothLength = Math.min(totalLength * 0.5, 0.1);
            for (let i = 1; i < N - 1; i++) {
                let a = angles[i];
                let d = distancesFromStart[i];
                let f = d / smoothLength;
                if (f > 0 && f < 1) {
                    f = Nabu.Easing.easeInOutSine(f);
                    angles[i] = (1 - f) * startBank + a * f;
                }
            }
            for (let i = N - 2; i > 0; i--) {
                let a = angles[i];
                let d = totalLength - distancesFromStart[i];
                let f = d / smoothLength;
                if (f > 0 && f < 1) {
                    f = Nabu.Easing.easeInOutSine(f);
                    angles[i] = (1 - f) * endBank + a * f;
                }
            }
            for (let i = 0; i < N; i++) {
                let prevPoint = this.templateInterpolatedPoints[i - 1];
                let point = this.templateInterpolatedPoints[i];
                let nextPoint = this.templateInterpolatedPoints[i + 1];
                let dir;
                if (nextPoint) {
                    dir = nextPoint;
                }
                else {
                    dir = point;
                }
                if (prevPoint) {
                    dir = dir.subtract(prevPoint);
                }
                else {
                    dir = dir.subtract(point);
                }
                Mummu.RotateInPlace(this.trackInterpolatedNormals[i], dir, angles[i]);
            }
            // Compute wire path
            for (let i = 0; i < N; i++) {
                let pPrev = this.templateInterpolatedPoints[i - 1] ? this.templateInterpolatedPoints[i - 1] : undefined;
                let p = this.templateInterpolatedPoints[i];
                let pNext = this.templateInterpolatedPoints[i + 1] ? this.templateInterpolatedPoints[i + 1] : undefined;
                if (!pPrev) {
                    pPrev = p.subtract(pNext.subtract(p));
                }
                if (!pNext) {
                    pNext = p.add(p.subtract(pPrev));
                }
                let dir = pNext.subtract(pPrev).normalize();
                let up = this.trackInterpolatedNormals[i];
                let rotation = BABYLON.Quaternion.Identity();
                Mummu.QuaternionFromZYAxisToRef(dir, up, rotation);
                let matrix = BABYLON.Matrix.Compose(BABYLON.Vector3.One(), rotation, p);
                this.wires[0].path[i] = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(-this.part.wireGauge * 0.5, 0, 0), matrix);
                this.wires[1].path[i] = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(this.part.wireGauge * 0.5, 0, 0), matrix);
            }
            Mummu.DecimatePathInPlace(this.wires[0].path, (2 / 180) * Math.PI);
            Mummu.DecimatePathInPlace(this.wires[1].path, (2 / 180) * Math.PI);
            if (this.template.drawStartTip) {
                this.wires[0].startTipCenter = this.template.trackpoints[0].position.clone();
                this.wires[0].startTipNormal = this.template.trackpoints[0].normal.clone();
                this.wires[0].startTipDir = this.template.trackpoints[0].dir.clone();
            }
            if (this.template.drawEndTip) {
                this.wires[0].endTipCenter = this.template.trackpoints[this.template.trackpoints.length - 1].position.clone();
                this.wires[0].endTipNormal = this.template.trackpoints[this.template.trackpoints.length - 1].normal.clone();
                this.wires[0].endTipDir = this.template.trackpoints[this.template.trackpoints.length - 1].dir.clone();
            }
        }
        recomputeAbsolutePath() {
            this.wires.forEach((wire) => {
                wire.recomputeAbsolutePath();
            });
        }
    }
    MarbleRunSimulatorCore.Track = Track;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
/// <reference path="Track.ts"/>
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class PipeTrack extends MarbleRunSimulatorCore.Track {
        constructor(part) {
            super(part);
            this.tubePath = [];
            this.AABBMin = BABYLON.Vector3.Zero();
            this.AABBMax = BABYLON.Vector3.Zero();
            this.wires = [new MarbleRunSimulatorCore.Wire(this.part), new MarbleRunSimulatorCore.Wire(this.part)];
        }
        get preferedStartBank() {
            return 0;
        }
        get preferedEndBank() {
            return 0;
        }
        get trackIndex() {
            return this.part.tracks.indexOf(this);
        }
        getSlopeAt(index) {
            let trackpoint = this.template.trackpoints[index];
            let nextTrackPoint = this.template.trackpoints[index + 1];
            if (trackpoint) {
                if (nextTrackPoint) {
                    let dy = nextTrackPoint.position.y - trackpoint.position.y;
                    let dLength = nextTrackPoint.summedLength - trackpoint.summedLength;
                    return (dy / dLength) * 100;
                }
                else {
                    let angleToVertical = Mummu.Angle(BABYLON.Axis.Y, trackpoint.dir);
                    let angleToHorizontal = Math.PI / 2 - angleToVertical;
                    return Math.tan(angleToHorizontal) * 100;
                }
            }
            return 0;
        }
        getBankAt(index) {
            return 0;
        }
        initialize(template) {
            this.template = template;
            this.trackInterpolatedNormals = template.interpolatedNormals.map((v) => {
                return v.clone();
            });
            // Update AABB values.
            let N = this.templateInterpolatedPoints.length;
            this.AABBMin.copyFromFloats(Infinity, Infinity, Infinity);
            this.AABBMax.copyFromFloats(-Infinity, -Infinity, -Infinity);
            for (let i = 0; i < N; i++) {
                let p = this.templateInterpolatedPoints[i];
                this.AABBMin.minimizeInPlace(p);
                this.AABBMax.maximizeInPlace(p);
            }
            this.AABBMin.x -= (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMin.y -= (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMin.z -= (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMax.x += (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMax.y += (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMax.z += (this.part.wireSize + this.part.wireGauge) * 0.5;
            BABYLON.Vector3.TransformCoordinatesToRef(this.AABBMin, this.part.getWorldMatrix(), this.AABBMin);
            BABYLON.Vector3.TransformCoordinatesToRef(this.AABBMax, this.part.getWorldMatrix(), this.AABBMax);
        }
        recomputeWiresPath(forceDisconnexion) {
            let N = this.templateInterpolatedPoints.length;
            let angles = [...this.template.angles];
            angles = angles.map(a => { return 0; });
            let startBank = this.preferedStartBank;
            if (!forceDisconnexion) {
                let otherS = this.part.machine.getBankAt(this.startWorldPosition, this.part);
                if (otherS) {
                    this.part.addNeighbour(otherS.part);
                    startBank = 0;
                }
            }
            let endBank = this.preferedEndBank;
            if (!forceDisconnexion) {
                let otherE = this.part.machine.getBankAt(this.endWorldPosition, this.part);
                if (otherE) {
                    this.part.addNeighbour(otherE.part);
                    endBank = 0;
                }
            }
            for (let i = 0; i < N; i++) {
                let prevPoint = this.templateInterpolatedPoints[i - 1];
                let point = this.templateInterpolatedPoints[i];
                let nextPoint = this.templateInterpolatedPoints[i + 1];
                let dir;
                if (nextPoint) {
                    dir = nextPoint;
                }
                else {
                    dir = point;
                }
                if (prevPoint) {
                    dir = dir.subtract(prevPoint);
                }
                else {
                    dir = dir.subtract(point);
                }
                Mummu.RotateInPlace(this.trackInterpolatedNormals[i], dir, angles[i]);
            }
            // Compute wire path
            for (let i = 0; i < N; i++) {
                let pPrev = this.templateInterpolatedPoints[i - 1] ? this.templateInterpolatedPoints[i - 1] : undefined;
                let p = this.templateInterpolatedPoints[i];
                let pNext = this.templateInterpolatedPoints[i + 1] ? this.templateInterpolatedPoints[i + 1] : undefined;
                if (!pPrev) {
                    pPrev = p.subtract(pNext.subtract(p));
                }
                if (!pNext) {
                    pNext = p.add(p.subtract(pPrev));
                }
                let dir = pNext.subtract(pPrev).normalize();
                let up = this.trackInterpolatedNormals[i];
                let rotation = BABYLON.Quaternion.Identity();
                Mummu.QuaternionFromZYAxisToRef(dir, up, rotation);
                let matrix = BABYLON.Matrix.Compose(BABYLON.Vector3.One(), rotation, p);
                this.wires[0].path[i] = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(-this.part.wireGauge * 0.5, 0, 0), matrix);
                this.wires[1].path[i] = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(this.part.wireGauge * 0.5, 0, 0), matrix);
            }
            Mummu.DecimatePathInPlace(this.wires[0].path, (2 / 180) * Math.PI);
            Mummu.DecimatePathInPlace(this.wires[1].path, (2 / 180) * Math.PI);
            if (this.template.drawStartTip) {
                this.wires[0].startTipCenter = this.template.trackpoints[0].position.clone();
                this.wires[0].startTipNormal = this.template.trackpoints[0].normal.clone();
                this.wires[0].startTipDir = this.template.trackpoints[0].dir.clone();
            }
            if (this.template.drawEndTip) {
                this.wires[0].endTipCenter = this.template.trackpoints[this.template.trackpoints.length - 1].position.clone();
                this.wires[0].endTipNormal = this.template.trackpoints[this.template.trackpoints.length - 1].normal.clone();
                this.wires[0].endTipDir = this.template.trackpoints[this.template.trackpoints.length - 1].dir.clone();
            }
        }
        recomputeAbsolutePath() {
            let points = [...this.templateInterpolatedPoints].map((p) => {
                return p.clone();
            });
            let normals = [...this.trackInterpolatedNormals].map((p) => {
                return p.clone();
            });
            this.tubePath = points.map((pt, i) => {
                return pt.add(normals[i].scale(0.008));
            });
            for (let i = 0; i < this.tubePath.length; i++) {
                BABYLON.Vector3.TransformCoordinatesToRef(this.tubePath[i], this.part.getWorldMatrix(), this.tubePath[i]);
            }
        }
    }
    MarbleRunSimulatorCore.PipeTrack = PipeTrack;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class PipeTrackMeshBuilder {
        static async BuildPipeTrackMesh(track, props) {
            let vertexDataLoader = track.part.game.vertexDataLoader;
            if (track.mesh) {
                track.mesh.dispose();
            }
            track.mesh = new BABYLON.Mesh("track-mesh");
            track.mesh.parent = track.part;
            track.mesh.material = track.part.game.materials.getMaterial(track.part.getColor(0), track.part.machine.materialQ);
            let ringIn = await vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/steampunk-pipe.babylon", 0);
            ringIn = Mummu.CloneVertexData(ringIn);
            let ringOut = Mummu.CloneVertexData(ringIn);
            let p0 = track.templateInterpolatedPoints[0];
            let p1 = track.templateInterpolatedPoints[1];
            let normIn = track.trackInterpolatedNormals[0];
            let dirIn = p1.subtract(p0).normalize();
            dirIn.x = Math.round(dirIn.x);
            dirIn.y = Math.round(dirIn.y);
            dirIn.z = Math.round(dirIn.z);
            //Mummu.DrawDebugLine(p0, p0.add(dirIn), 300, BABYLON.Color3.Red()).parent = track.part;
            let pN1 = track.templateInterpolatedPoints[track.templateInterpolatedPoints.length - 2];
            let pN = track.templateInterpolatedPoints[track.templateInterpolatedPoints.length - 1];
            let normOut = track.trackInterpolatedNormals[track.trackInterpolatedNormals.length - 1];
            let dirOut = pN.subtract(pN1).normalize();
            dirOut.x = Math.round(dirOut.x);
            dirOut.y = Math.round(dirOut.y);
            dirOut.z = Math.round(dirOut.z);
            //Mummu.DrawDebugLine(pN, pN.add(dirOut), 300, BABYLON.Color3.Green()).parent = track.part;
            Mummu.RotateVertexDataInPlace(ringIn, Mummu.QuaternionFromZYAxis(dirIn, normIn));
            Mummu.RotateVertexDataInPlace(ringOut, Mummu.QuaternionFromZYAxis(dirOut.scale(-1), normOut));
            Mummu.TranslateVertexDataInPlace(ringIn, p0);
            Mummu.TranslateVertexDataInPlace(ringOut, pN);
            let points = [...track.templateInterpolatedPoints].map((p) => {
                return p.clone();
            });
            let normals = [...track.trackInterpolatedNormals].map((p) => {
                return p.clone();
            });
            Mummu.RemoveFromStartForDistanceInPlace(points, 0.001);
            Mummu.RemoveFromEndForDistanceInPlace(points, 0.001);
            Mummu.DecimatePathInPlace(points, (2 / 180) * Math.PI, normals);
            points = points.map((pt, i) => {
                return pt.add(normals[i].scale(0.008));
            });
            let pipeData = Mummu.CreateWireVertexData({ path: points, pathUps: normals, tesselation: 12, radius: 0.011, color: new BABYLON.Color4(1, 1, 1, 1), closed: false, textureRatio: 4 });
            let flip = Mummu.CloneVertexData(pipeData);
            Mummu.TriFlipVertexDataInPlace(flip);
            let allDatas = [ringIn, ringOut, pipeData, flip];
            //for (let i = 0; i < points.length; i++) {
            //    let cube = BABYLON.CreateBoxVertexData({ size: 0.001 });
            //    Mummu.TranslateVertexDataInPlace(cube, points[i]);
            //    allDatas.push(cube);
            //}
            Mummu.MergeVertexDatas(...allDatas).applyToMesh(track.mesh);
        }
    }
    MarbleRunSimulatorCore.PipeTrackMeshBuilder = PipeTrackMeshBuilder;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class SleeperMeshBuilder {
        static GenerateSleepersVertexData(part, props) {
            if (!isFinite(props.spacing)) {
                props.spacing = 0.03;
            }
            if (!isFinite(props.grndAnchorsMaxY)) {
                props.grndAnchorsMaxY = 1;
            }
            let q = part.machine.geometryQ;
            let partialsDatas = [];
            for (let j = 0; j < part.tracks.length; j++) {
                let track = part.tracks[j];
                let colorIndex = track.part.getColor(track.template.colorIndex);
                let interpolatedPoints = track.templateInterpolatedPoints;
                let summedLength = [0];
                for (let i = 1; i < interpolatedPoints.length; i++) {
                    let prev = interpolatedPoints[i - 1];
                    let trackpoint = interpolatedPoints[i];
                    let dist = BABYLON.Vector3.Distance(prev, trackpoint);
                    summedLength[i] = summedLength[i - 1] + dist;
                }
                let count = Math.round(summedLength[summedLength.length - 1] / props.spacing / 3) * 3;
                count = Math.max(1, count);
                let correctedSpacing = summedLength[summedLength.length - 1] / count;
                let radiusShape = part.wireSize * 0.5 * 0.75;
                if (part.game.materials.getMaterialType(colorIndex) === MarbleRunSimulatorCore.MaterialType.Plastic) {
                    radiusShape *= 2;
                }
                let nShape = 4;
                let shape = [];
                for (let i = 0; i < nShape; i++) {
                    let a = (i / nShape) * 2 * Math.PI;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);
                    shape[i] = new BABYLON.Vector3(cosa * radiusShape, sina * radiusShape, 0);
                }
                let sleeperPieceVertexDataTypeIndex = (part.game.materials.getMaterialType(colorIndex) === MarbleRunSimulatorCore.MaterialType.Plastic) ? 3 : 0;
                if (q === 1) {
                    sleeperPieceVertexDataTypeIndex += 1;
                }
                else if (q === 0) {
                    sleeperPieceVertexDataTypeIndex += 2;
                }
                let sleeperPieceVertexData = part.machine.sleeperVertexData ? part.machine.sleeperVertexData[sleeperPieceVertexDataTypeIndex] : undefined;
                let quat = BABYLON.Quaternion.Identity();
                let n = 0.5;
                for (let i = 1; i < interpolatedPoints.length - 1; i++) {
                    let sumPrev = summedLength[i - 1];
                    let sum = summedLength[i];
                    let sumNext = summedLength[i + 1];
                    let targetSumLength = n * correctedSpacing;
                    let addSleeper = false;
                    if (sumPrev < targetSumLength && sum >= targetSumLength) {
                        let f = (targetSumLength - sumPrev) / (sum - sumPrev);
                        if (f > 0.5) {
                            addSleeper = true;
                        }
                    }
                    if (sum <= targetSumLength && sumNext > targetSumLength) {
                        let f = (targetSumLength - sum) / (sumNext - sum);
                        if (f <= 0.5) {
                            addSleeper = true;
                        }
                    }
                    if (track.template.cutOutSleeper && track.template.cutOutSleeper(i)) {
                        addSleeper = false;
                    }
                    if (track instanceof MarbleRunSimulatorCore.PipeTrack || track instanceof MarbleRunSimulatorCore.WoodTrack) {
                        addSleeper = false;
                    }
                    let anchor = BABYLON.Vector3.Zero();
                    if (addSleeper && sleeperPieceVertexData) {
                        anchor = new BABYLON.Vector3(0, -part.wireGauge * 0.5, 0);
                        let dir = interpolatedPoints[i + 1].subtract(interpolatedPoints[i - 1]).normalize();
                        let t = interpolatedPoints[i];
                        let up = track.trackInterpolatedNormals[i];
                        Mummu.QuaternionFromYZAxisToRef(up, dir, quat);
                        anchor.rotateByQuaternionToRef(quat, anchor);
                        anchor.addInPlace(t);
                        let tmp = Mummu.CloneVertexData(sleeperPieceVertexData);
                        Mummu.RotateVertexDataInPlace(tmp, quat);
                        Mummu.TranslateVertexDataInPlace(tmp, t);
                        if (!partialsDatas[colorIndex]) {
                            partialsDatas[colorIndex] = [];
                        }
                        partialsDatas[colorIndex].push(tmp);
                        if (track.part.isPlaced && (props.drawWallAnchors || props.forceDrawWallAnchors)) {
                            let addAnchor = false;
                            if ((part.k === 0 || props.forceDrawWallAnchors) && (n - 1.5) % 3 === 0 && up.y > 0.1) {
                                if (anchor.z > -0.01) {
                                    addAnchor = true;
                                }
                            }
                            if (addAnchor) {
                                let anchorCenter = anchor.clone();
                                anchorCenter.z = 0.015;
                                if (isFinite(props.forcedWallAnchorsZ)) {
                                    anchorCenter.z = props.forcedWallAnchorsZ;
                                }
                                let radiusFixation = Math.abs(anchor.z - anchorCenter.z);
                                let anchorWall = anchorCenter.clone();
                                anchorWall.y -= radiusFixation * 0.5;
                                let nFixation = 2;
                                if (q === 1) {
                                    nFixation = 6;
                                }
                                else if (q === 2) {
                                    nFixation = 10;
                                }
                                let fixationPath = [];
                                for (let i = 0; i <= nFixation; i++) {
                                    let a = (i / nFixation) * 0.5 * Math.PI;
                                    let cosa = Math.cos(a);
                                    let sina = Math.sin(a);
                                    fixationPath[i] = new BABYLON.Vector3(0, -sina * radiusFixation * 0.5, -cosa * radiusFixation);
                                    fixationPath[i].addInPlace(anchorCenter);
                                }
                                let tmp = BABYLON.ExtrudeShape("tmp", { shape: shape, path: fixationPath, closeShape: true, cap: BABYLON.Mesh.CAP_ALL });
                                let colorIndex = track.part.getColor(track.template.colorIndex);
                                if (!partialsDatas[colorIndex]) {
                                    partialsDatas[colorIndex] = [];
                                }
                                partialsDatas[colorIndex].push(BABYLON.VertexData.ExtractFromMesh(tmp));
                                tmp.dispose();
                                let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.001, diameter: 0.01, tessellation: 16 });
                                let quat = BABYLON.Quaternion.Identity();
                                Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), quat);
                                Mummu.RotateVertexDataInPlace(tmpVertexData, quat);
                                Mummu.TranslateVertexDataInPlace(tmpVertexData, anchorWall);
                                partialsDatas[colorIndex].push(tmpVertexData);
                                tmp.dispose();
                            }
                        }
                        if (track.part.isPlaced && (props.grndAnchors && q > 0)) {
                            if (((n - 1.5) % 6 === 0 || count === 1) && up.y > 0.1) {
                                let anchorYWorld = anchor.y + part.position.y;
                                let anchorBase = anchor.clone();
                                let minY = part.machine.baseMeshMinY;
                                let maxY = part.machine.baseMeshMaxY;
                                anchorBase.y = part.machine.baseMeshMinY - part.position.y;
                                if (anchorYWorld < minY + props.grndAnchorsMaxY * (maxY - minY)) {
                                    let rayOrigin = anchor.add(part.position);
                                    let rayDir = new BABYLON.Vector3(0, -1, 0);
                                    rayOrigin.addInPlace(rayDir.scale(0.01));
                                    let ray = new BABYLON.Ray(rayOrigin, rayDir, 3);
                                    let pick = part.game.scene.pickWithRay(ray, (m) => {
                                        return m instanceof MarbleRunSimulatorCore.MachinePartSelectorMesh;
                                    });
                                    if (!pick.hit) {
                                        let fixationPath = [anchor, anchorBase];
                                        let tmp = BABYLON.ExtrudeShape("tmp", { shape: shape, path: fixationPath, closeShape: false, cap: BABYLON.Mesh.CAP_ALL });
                                        let colorIndex = track.part.getColor(track.template.colorIndex);
                                        if (!partialsDatas[colorIndex]) {
                                            partialsDatas[colorIndex] = [];
                                        }
                                        partialsDatas[colorIndex].push(BABYLON.VertexData.ExtractFromMesh(tmp));
                                        tmp.dispose();
                                        let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.002, diameter: 0.012, tessellation: 8 });
                                        Mummu.TranslateVertexDataInPlace(tmpVertexData, anchorBase);
                                        partialsDatas[colorIndex].push(tmpVertexData);
                                        tmp.dispose();
                                    }
                                }
                            }
                        }
                        n++;
                    }
                }
            }
            let datas = new Map();
            for (let i = 0; i < partialsDatas.length; i++) {
                if (partialsDatas[i]) {
                    datas.set(i, Mummu.MergeVertexDatas(...partialsDatas[i]));
                }
            }
            return datas;
        }
    }
    MarbleRunSimulatorCore.SleeperMeshBuilder = SleeperMeshBuilder;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    let TrackSpeed;
    (function (TrackSpeed) {
        TrackSpeed[TrackSpeed["Flat"] = 0] = "Flat";
        TrackSpeed[TrackSpeed["Slow"] = 1] = "Slow";
        TrackSpeed[TrackSpeed["Medium"] = 2] = "Medium";
        TrackSpeed[TrackSpeed["Fast"] = 3] = "Fast";
    })(TrackSpeed = MarbleRunSimulatorCore.TrackSpeed || (MarbleRunSimulatorCore.TrackSpeed = {}));
    MarbleRunSimulatorCore.TrackSpeedNames = [
        "Flat",
        "Slow",
        "Medium",
        "Fast"
    ];
    class TrackTemplate {
        constructor(partTemplate) {
            this.partTemplate = partTemplate;
            this.trackpoints = ([] = []);
            this.interpolatedPoints = [];
            this.interpolatedNormals = [];
            this.angles = [];
            this.drawStartTip = false;
            this.drawEndTip = false;
            this.preferedStartBank = 0;
            this.preferedEndBank = 0;
            this.colorIndex = 0;
            this.isPipe = false;
            this.isWood = false;
            this.summedLength = [0];
            this.totalLength = 0;
            this.globalSlope = 0;
            this.AABBMin = BABYLON.Vector3.Zero();
            this.AABBMax = BABYLON.Vector3.Zero();
            this.noMiniatureRender = false;
        }
        get isPipeOrWood() {
            return this.isPipe || this.isWood;
        }
        mirrorXTrackPointsInPlace() {
            for (let i = 0; i < this.trackpoints.length; i++) {
                this.trackpoints[i].position.x *= -1;
                this.trackpoints[i].position.x += (this.partTemplate.l - 1) * MarbleRunSimulatorCore.tileWidth;
                if (this.trackpoints[i].normal) {
                    this.trackpoints[i].normal.x *= -1;
                }
                if (this.trackpoints[i].dir) {
                    this.trackpoints[i].dir.x *= -1;
                }
            }
        }
        mirrorZTrackPointsInPlace() {
            for (let i = 0; i < this.trackpoints.length; i++) {
                this.trackpoints[i].position.z += (this.partTemplate.d - 1) * MarbleRunSimulatorCore.tileDepth * 0.5;
                this.trackpoints[i].position.z *= -1;
                this.trackpoints[i].position.z -= (this.partTemplate.d - 1) * MarbleRunSimulatorCore.tileDepth * 0.5;
                if (this.trackpoints[i].normal) {
                    this.trackpoints[i].normal.z *= -1;
                }
                if (this.trackpoints[i].dir) {
                    this.trackpoints[i].dir.z *= -1;
                }
            }
        }
        initialize() {
            if (this.trackpoints[0] && this.trackpoints[this.trackpoints.length - 1]) {
                let start = this.trackpoints[0].position;
                if (MarbleRunSimulatorCore.Tools.IsWorldPosAConnexion(start)) {
                    this.partTemplate.endPoints.push(start.clone());
                    this.partTemplate.endPointDirections.push(this.trackpoints[0].dir);
                }
                let end = this.trackpoints[this.trackpoints.length - 1].position;
                if (MarbleRunSimulatorCore.Tools.IsWorldPosAConnexion(end)) {
                    this.partTemplate.endPoints.push(end.clone());
                    this.partTemplate.endPointDirections.push(this.trackpoints[this.trackpoints.length - 1].dir.scale(-1));
                }
            }
            for (let i = 1; i < this.trackpoints.length - 1; i++) {
                let prevTrackPoint = this.trackpoints[i - 1];
                let trackPoint = this.trackpoints[i];
                let nextTrackPoint = this.trackpoints[i + 1];
                if (!trackPoint.fixedDir) {
                    trackPoint.dir.copyFrom(nextTrackPoint.position).subtractInPlace(prevTrackPoint.position).normalize();
                }
                if (!trackPoint.fixedTangentIn) {
                    trackPoint.tangentIn = 1;
                }
                if (!trackPoint.fixedTangentOut) {
                    trackPoint.tangentOut = 1;
                }
            }
            this.trackpoints[0].summedLength = 0;
            for (let i = 0; i < this.trackpoints.length - 1; i++) {
                let trackPoint = this.trackpoints[i];
                let nextTrackPoint = this.trackpoints[i + 1];
                let dist = BABYLON.Vector3.Distance(trackPoint.position, nextTrackPoint.position);
                let tanIn = this.trackpoints[i].dir.scale(dist * trackPoint.tangentOut);
                let tanOut = this.trackpoints[i + 1].dir.scale(dist * nextTrackPoint.tangentIn);
                let count = Math.round(dist / 0.002);
                count = Math.max(0, count);
                this.interpolatedPoints.push(trackPoint.position);
                nextTrackPoint.summedLength = trackPoint.summedLength;
                for (let k = 1; k < count; k++) {
                    let amount = k / count;
                    let point = BABYLON.Vector3.Hermite(trackPoint.position, tanIn, nextTrackPoint.position, tanOut, amount);
                    this.interpolatedPoints.push(point);
                    nextTrackPoint.summedLength += BABYLON.Vector3.Distance(this.interpolatedPoints[this.interpolatedPoints.length - 2], this.interpolatedPoints[this.interpolatedPoints.length - 1]);
                }
                nextTrackPoint.summedLength += BABYLON.Vector3.Distance(nextTrackPoint.position, this.interpolatedPoints[this.interpolatedPoints.length - 1]);
            }
            this.interpolatedPoints.push(this.trackpoints[this.trackpoints.length - 1].position);
            let N = this.interpolatedPoints.length;
            let normalsForward = [];
            let normalsBackward = [];
            normalsForward.push(this.trackpoints[0].normal);
            for (let i = 1; i < this.interpolatedPoints.length - 1; i++) {
                let prevNormal = normalsForward[i - 1];
                let point = this.interpolatedPoints[i];
                let nextPoint = this.interpolatedPoints[i + 1];
                let dir = nextPoint.subtract(point).normalize();
                let n = prevNormal;
                let right = BABYLON.Vector3.Cross(n, dir);
                n = BABYLON.Vector3.Cross(dir, right).normalize();
                if (this.onNormalEvaluated) {
                    this.onNormalEvaluated(n, point, i / (this.interpolatedPoints.length - 1));
                }
                normalsForward.push(n);
            }
            normalsForward.push(this.trackpoints[this.trackpoints.length - 1].normal);
            normalsBackward[this.interpolatedPoints.length - 1] = this.trackpoints[this.trackpoints.length - 1].normal;
            for (let i = this.interpolatedPoints.length - 2; i >= 1; i--) {
                let prevNormal = normalsBackward[i + 1];
                let point = this.interpolatedPoints[i];
                let prevPoint = this.interpolatedPoints[i - 1];
                let dir = prevPoint.subtract(point).normalize();
                let n = prevNormal;
                let right = BABYLON.Vector3.Cross(n, dir);
                n = BABYLON.Vector3.Cross(dir, right).normalize();
                if (this.onNormalEvaluated) {
                    this.onNormalEvaluated(n, point, i / (this.interpolatedPoints.length - 1));
                }
                normalsBackward[i] = n;
            }
            normalsBackward[0] = this.trackpoints[0].normal;
            for (let i = 0; i < N; i++) {
                let f = i / (N - 1);
                this.interpolatedNormals[i] = BABYLON.Vector3.Lerp(normalsForward[i], normalsBackward[i], f).normalize();
            }
            this.angles = new Array(N);
            if (isFinite(this.forcedAngle)) {
                this.angles.fill(this.forcedAngle);
            }
            else {
                this.angles.fill(0);
                let maxR = 0;
                let lastSign = 0;
                for (let i = 1; i < N - 1; i++) {
                    let n = this.interpolatedNormals[i];
                    let prevPoint = this.interpolatedPoints[i - 1];
                    let point = this.interpolatedPoints[i];
                    let nextPoint = this.interpolatedPoints[i + 1];
                    let dirPrev = point.subtract(prevPoint);
                    let dPrev = dirPrev.length();
                    let dirNext = nextPoint.subtract(point);
                    let dNext = dirNext.length();
                    let a = Mummu.AngleFromToAround(dirPrev.scale(-1), dirNext, n);
                    if (Math.abs(a) < Math.PI * 0.9999999) {
                        let sign = Math.sign(a);
                        lastSign += sign / 10;
                        lastSign = Nabu.MinMax(lastSign, -1, 1);
                        let rPrev = Math.tan(Math.abs(a) / 2) * (dPrev * 0.5);
                        let rNext = Math.tan(Math.abs(a) / 2) * (dNext * 0.5);
                        let r = (rPrev + rNext) * 0.5;
                        maxR = Math.max(r, maxR);
                        let f = this.partTemplate.minTurnRadius / r;
                        f = Math.max(Math.min(f, 1), 0);
                        this.angles[i] = Math.max(this.partTemplate.maxAngle * f, this.partTemplate.defaultAngle) * sign;
                        if (Math.abs(lastSign) >= 1) {
                            if (i > 0 && this.angles[i - 1] === undefined) {
                                for (let ii = i; ii >= 0; ii--) {
                                    if (this.angles[ii] === undefined) {
                                        this.angles[ii] = this.partTemplate.defaultAngle * lastSign;
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (Math.abs(lastSign) >= 1) {
                            this.angles[i] = this.partTemplate.defaultAngle * lastSign;
                        }
                        else {
                            this.angles[i] = undefined;
                        }
                    }
                }
            }
            this.angles = this.angles.map(a => {
                if (a === undefined) {
                    return 0;
                }
                return a;
            });
            let tmpAngles = [...this.angles];
            let f = 1;
            for (let n = 0; n < 30; n++) {
                for (let i = 0; i < N; i++) {
                    let aPrev = tmpAngles[i - 1];
                    let a = tmpAngles[i];
                    let point = this.interpolatedPoints[i];
                    let aNext = tmpAngles[i + 1];
                    if (isFinite(aPrev) && isFinite(aNext)) {
                        let prevPoint = this.interpolatedPoints[i - 1];
                        let distPrev = BABYLON.Vector3.Distance(prevPoint, point);
                        let nextPoint = this.interpolatedPoints[i + 1];
                        let distNext = BABYLON.Vector3.Distance(nextPoint, point);
                        let d = distPrev / (distPrev + distNext);
                        tmpAngles[i] = (1 - f) * a + f * ((1 - d) * aPrev + d * aNext);
                    }
                    else if (isFinite(aPrev)) {
                        tmpAngles[i] = (1 - f) * a + f * aPrev;
                    }
                    else if (isFinite(aNext)) {
                        tmpAngles[i] = (1 - f) * a + f * aNext;
                    }
                }
            }
            this.angles = tmpAngles;
            this.angles[0] = this.angles[1];
            this.angles[N - 1] = this.angles[N - 2];
            this.preferedStartBank = this.angles[0];
            this.preferedEndBank = this.angles[this.angles.length - 1];
            this.summedLength = [0];
            this.totalLength = 0;
            for (let i = 0; i < N - 1; i++) {
                let p = this.interpolatedPoints[i];
                let pNext = this.interpolatedPoints[i + 1];
                let dir = pNext.subtract(p);
                let d = dir.length();
                dir.scaleInPlace(1 / d);
                let right = BABYLON.Vector3.Cross(this.interpolatedNormals[i], dir);
                this.interpolatedNormals[i] = BABYLON.Vector3.Cross(dir, right).normalize();
                this.summedLength[i + 1] = this.summedLength[i] + d;
            }
            this.totalLength = this.summedLength[N - 1];
            let dh = this.interpolatedPoints[this.interpolatedPoints.length - 1].y - this.interpolatedPoints[0].y;
            this.globalSlope = (dh / this.totalLength) * 100;
        }
    }
    MarbleRunSimulatorCore.TrackTemplate = TrackTemplate;
    class MachinePartTemplate {
        constructor() {
            this.partName = "machine-part-template";
            this.l = 1;
            this.h = 1;
            this.d = 1;
            this.n = 1;
            this.s = TrackSpeed.Medium;
            this.mirrorX = false;
            this.mirrorZ = false;
            this.angleSmoothSteps = 30;
            this.defaultAngle = 0;
            this.maxAngle = Math.PI / 4;
            this.minTurnRadius = 0.06;
            this.lExtendableOnX = false;
            this.lExtendableOnXZ = false;
            this.lExtendableOnZ = false;
            this.hExtendableOnY = false;
            this.dExtendableOnZ = false;
            this.xExtendable = false;
            this.yExtendable = false;
            this.downwardYExtendable = false;
            this.zExtendable = false;
            this.nExtendable = false;
            this.sExtendable = false;
            this.minLAbsolute = 0;
            this.minL = 1;
            this.maxL = 35;
            this.minH = 0;
            this.maxH = 35;
            this.minDAbsolute = 0;
            this.minD = 1;
            this.maxD = 35;
            this.minN = 1;
            this.maxN = 35;
            this.minS = 0;
            this.maxS = 3;
            this.xMirrorable = false;
            this.zMirrorable = false;
            this.hasOriginDestinationHandles = false;
            this.trackTemplates = [];
            this.endPoints = [];
            this.endPointDirections = [];
            this.miniatureExtraLines = [];
            this.miniatureShapes = [];
        }
        mirrorXTrackPointsInPlace() {
            for (let i = 0; i < this.trackTemplates.length; i++) {
                this.trackTemplates[i].mirrorXTrackPointsInPlace();
            }
        }
        mirrorZTrackPointsInPlace() {
            for (let i = 0; i < this.trackTemplates.length; i++) {
                this.trackTemplates[i].mirrorZTrackPointsInPlace();
            }
        }
        initialize() {
            this.trackTemplates.forEach((trackTemplate) => {
                trackTemplate.initialize();
            });
        }
    }
    MarbleRunSimulatorCore.MachinePartTemplate = MachinePartTemplate;
    class TemplateManager {
        constructor(machine) {
            this.machine = machine;
            this._dictionary = new Map();
        }
        getTemplate(partName, mirrorX, mirrorZ) {
            let mirrorIndex = (mirrorX ? 0 : 1) + (mirrorZ ? 0 : 2);
            let data;
            let datas = this._dictionary.get(partName);
            if (datas && datas[mirrorIndex]) {
                data = datas[mirrorIndex];
            }
            else {
                if (!datas) {
                    datas = [];
                }
                this._dictionary.set(partName, datas);
            }
            if (!data) {
                if (partName.startsWith("curb_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    let s = parseInt(partName.split("_")[1].split(".")[2]);
                    if (isNaN(s)) {
                        s = 2;
                    }
                    data = MarbleRunSimulatorCore.Curb.GenerateTemplate(l, h, s, false, false);
                }
                else if (partName.startsWith("uturn_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    let s = parseInt(partName.split("_")[1].split(".")[2]);
                    if (isNaN(s)) {
                        s = 2;
                    }
                    data = MarbleRunSimulatorCore.UTurn.GenerateTemplate(l, h, s);
                }
                else if (partName.startsWith("pipeuturn_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = MarbleRunSimulatorCore.UTurn.GenerateTemplate(l, h, 2, true);
                }
                else if (partName.startsWith("wooduturn_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = MarbleRunSimulatorCore.UTurn.GenerateTemplate(l, h, 0, false, true);
                }
                else if (partName.startsWith("wall_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = MarbleRunSimulatorCore.Wall.GenerateTemplate(l, h);
                }
                else if (partName.startsWith("uturnsharp")) {
                    let h = parseInt(partName.split("_")[1].split(".")[0]);
                    data = MarbleRunSimulatorCore.UTurnSharp.GenerateTemplate(h);
                }
                else if (partName.startsWith("ramp_")) {
                    let w = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    let d = parseInt(partName.split("_")[1].split(".")[2]);
                    let s = parseInt(partName.split("_")[1].split(".")[3]);
                    if (isNaN(s)) {
                        s = 2;
                    }
                    data = MarbleRunSimulatorCore.Ramp.GenerateTemplate(w, h, isFinite(d) ? d : 1, s, mirrorX, mirrorZ);
                }
                else if (partName.startsWith("rampv2_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    let d = parseInt(partName.split("_")[1].split(".")[2]);
                    data = MarbleRunSimulatorCore.Ramp.GenerateTemplate(l, h, d, 2, false, false);
                }
                else if (partName.startsWith("piperamp_")) {
                    let w = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    let d = parseInt(partName.split("_")[1].split(".")[2]);
                    data = MarbleRunSimulatorCore.Ramp.GenerateTemplate(w, h, isFinite(d) ? d : 1, 0, true);
                }
                else if (partName.startsWith("woodramp_")) {
                    let w = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    let d = parseInt(partName.split("_")[1].split(".")[2]);
                    data = MarbleRunSimulatorCore.Ramp.GenerateTemplate(w, h, isFinite(d) ? d : 1, 0, false, true);
                }
                else if (partName.startsWith("wave_")) {
                    let w = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    let d = parseInt(partName.split("_")[1].split(".")[2]);
                    data = MarbleRunSimulatorCore.Wave.GenerateTemplate(w, h, isFinite(d) ? d : 0);
                }
                else if (partName.startsWith("snake_")) {
                    let w = parseInt(partName.split("_")[1].split(".")[0]);
                    let s = parseInt(partName.split("_")[1].split(".")[1]);
                    if (isNaN(s)) {
                        s = 2;
                    }
                    data = MarbleRunSimulatorCore.Snake.GenerateTemplate(w, s, mirrorX, mirrorZ);
                }
                else if (partName.startsWith("elevator_")) {
                    let h = parseInt(partName.split("_")[1]);
                    data = MarbleRunSimulatorCore.Elevator.GenerateTemplate(h);
                }
                else if (partName.startsWith("steamelevator_")) {
                    let h = parseInt(partName.split("_")[1]);
                    data = MarbleRunSimulatorCore.SteamElevator.GenerateTemplate(h, mirrorX);
                }
                else if (partName.startsWith("shooter_")) {
                    let h = parseInt(partName.split("_")[1].split(".")[0]);
                    let n = parseInt(partName.split("_")[1].split(".")[1]);
                    data = MarbleRunSimulatorCore.Shooter.GenerateTemplate(h, n);
                }
                else if (partName.startsWith("stairway_")) {
                    let w = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = MarbleRunSimulatorCore.Stairway.GenerateTemplate(w, h);
                }
                else if (partName.startsWith("screw_")) {
                    let w = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = MarbleRunSimulatorCore.Screw.GenerateTemplate(w, h);
                }
                else if (partName === "split") {
                    data = MarbleRunSimulatorCore.Split.GenerateTemplate(mirrorZ);
                }
                else if (partName === "forwardSplit") {
                    data = MarbleRunSimulatorCore.ForwardSplit.GenerateTemplate(mirrorZ);
                }
                else if (partName === "sort") {
                    data = MarbleRunSimulatorCore.Sort.GenerateTemplate(mirrorX, mirrorZ);
                }
                else if (partName === "controller") {
                    data = MarbleRunSimulatorCore.Controller.GenerateTemplate(mirrorX);
                }
                else if (partName === "spawner") {
                    data = MarbleRunSimulatorCore.Spawner.GenerateTemplate(mirrorX);
                }
                else if (partName === "flatjoin") {
                    data = MarbleRunSimulatorCore.FlatJoin.GenerateTemplate(mirrorX);
                }
                else if (partName === "join") {
                    data = MarbleRunSimulatorCore.Join.GenerateTemplate(mirrorX);
                }
                else if (partName.startsWith("multiJoin_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    data = MarbleRunSimulatorCore.MultiJoin.GenerateTemplate(l, mirrorX);
                }
                else if (partName.startsWith("loop_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let d = parseInt(partName.split("_")[1].split(".")[1]);
                    let n = parseInt(partName.split("_")[1].split(".")[2]);
                    data = MarbleRunSimulatorCore.Loop.GenerateTemplate(l, d, n);
                }
                else if (partName.startsWith("spiral_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = MarbleRunSimulatorCore.Spiral.GenerateTemplate(l, h);
                }
                else if (partName.startsWith("spiralUTurn_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = MarbleRunSimulatorCore.SpiralUTurn.GenerateTemplate(l, h);
                }
                else if (partName === "quarter") {
                    data = MarbleRunSimulatorCore.QuarterNote.GenerateTemplate(mirrorX);
                }
                else if (partName === "double") {
                    data = MarbleRunSimulatorCore.DoubleNote.GenerateTemplate(mirrorX);
                }
                else if (partName === "start") {
                    data = MarbleRunSimulatorCore.Start.GenerateTemplate(mirrorX);
                }
                else if (partName === "end") {
                    data = MarbleRunSimulatorCore.End.GenerateTemplate(mirrorX);
                }
                else if (partName.startsWith("jumper_")) {
                    let n = parseInt(partName.split("_")[1].split(".")[0]);
                    data = MarbleRunSimulatorCore.Jumper.GenerateTemplate(n);
                }
                else if (partName === "gravitywell") {
                    data = MarbleRunSimulatorCore.GravityWell.GenerateTemplate(mirrorX);
                }
                else if (partName === "screen") {
                    data = MarbleRunSimulatorCore.Screen.GenerateTemplate();
                }
                else if (partName === "speeder" || partName.startsWith("speeder_")) {
                    let l = 3;
                    if (partName.indexOf("_") != -1) {
                        let lValue = parseInt(partName.split("_")[1].split(".")[0]);
                        if (isFinite(lValue)) {
                            l = lValue;
                        }
                    }
                    data = MarbleRunSimulatorCore.Speeder.GenerateTemplate(l);
                }
                else if (partName === "trikeSkull") {
                    data = MarbleRunSimulatorCore.TrikeSkull.GenerateTemplate();
                }
                datas[mirrorIndex] = data;
            }
            return data;
        }
        getTemplateByProp(baseName, prop) {
            let partName = "";
            if (baseName === "curb") {
                partName = MarbleRunSimulatorCore.Curb.PropToPartName(prop);
            }
            else if (baseName === "uturn") {
                partName = MarbleRunSimulatorCore.UTurn.PropToPartName(prop);
            }
            else if (baseName === "pipeuturn") {
                partName = MarbleRunSimulatorCore.UTurn.PropToPartName(prop);
            }
            else if (baseName === "wooduturn") {
                partName = MarbleRunSimulatorCore.UTurn.PropToPartName(prop);
            }
            else if (baseName === "wall") {
                partName = MarbleRunSimulatorCore.Wall.PropToPartName(prop);
            }
            else if (baseName === "uturnsharp") {
                partName = MarbleRunSimulatorCore.UTurnSharp.PropToPartName(prop);
            }
            else if (baseName === "ramp") {
                partName = MarbleRunSimulatorCore.Ramp.PropToPartName(prop);
            }
            else if (baseName === "rampv2") {
                partName = MarbleRunSimulatorCore.Ramp.PropToPartName(prop);
            }
            else if (baseName === "piperamp") {
                partName = MarbleRunSimulatorCore.Ramp.PropToPartName(prop);
            }
            else if (baseName === "woodramp") {
                partName = MarbleRunSimulatorCore.Ramp.PropToPartName(prop);
            }
            else if (baseName === "wave") {
                partName = MarbleRunSimulatorCore.Wave.PropToPartName(prop);
            }
            else if (baseName === "snake") {
                partName = MarbleRunSimulatorCore.Snake.PropToPartName(prop);
            }
            else if (baseName === "elevator") {
                partName = MarbleRunSimulatorCore.Elevator.PropToPartName(prop);
            }
            else if (baseName === "steamelevator") {
                partName = MarbleRunSimulatorCore.SteamElevator.PropToPartName(prop);
            }
            else if (baseName === "shooter") {
                partName = MarbleRunSimulatorCore.Shooter.PropToPartName(prop);
            }
            else if (baseName === "stairway") {
                partName = MarbleRunSimulatorCore.Stairway.PropToPartName(prop);
            }
            else if (baseName === "screw") {
                partName = MarbleRunSimulatorCore.Screw.PropToPartName(prop);
            }
            else if (baseName === "split") {
                partName = MarbleRunSimulatorCore.Split.PropToPartName(prop);
            }
            else if (baseName === "forwardSplit") {
                partName = MarbleRunSimulatorCore.ForwardSplit.PropToPartName(prop);
            }
            else if (baseName === "sort") {
                partName = MarbleRunSimulatorCore.Sort.PropToPartName(prop);
            }
            else if (baseName === "controller") {
                partName = MarbleRunSimulatorCore.Controller.PropToPartName(prop);
            }
            else if (baseName === "spawner") {
                partName = MarbleRunSimulatorCore.Spawner.PropToPartName(prop);
            }
            else if (baseName === "flatjoin") {
                partName = MarbleRunSimulatorCore.FlatJoin.PropToPartName(prop);
            }
            else if (baseName === "join") {
                partName = MarbleRunSimulatorCore.Join.PropToPartName(prop);
            }
            else if (baseName === "multiJoin") {
                partName = MarbleRunSimulatorCore.MultiJoin.PropToPartName(prop);
            }
            else if (baseName === "loop") {
                partName = MarbleRunSimulatorCore.Loop.PropToPartName(prop);
            }
            else if (baseName === "spiral") {
                partName = MarbleRunSimulatorCore.Spiral.PropToPartName(prop);
            }
            else if (baseName === "spiralUTurn") {
                partName = MarbleRunSimulatorCore.SpiralUTurn.PropToPartName(prop);
            }
            else if (baseName === "quarter") {
                partName = MarbleRunSimulatorCore.QuarterNote.PropToPartName(prop);
            }
            else if (baseName === "double") {
                partName = MarbleRunSimulatorCore.DoubleNote.PropToPartName(prop);
            }
            else if (baseName === "start") {
                partName = MarbleRunSimulatorCore.Start.PropToPartName(prop);
            }
            else if (baseName === "end") {
                partName = MarbleRunSimulatorCore.End.PropToPartName(prop);
            }
            else if (baseName === "jumper") {
                partName = MarbleRunSimulatorCore.Jumper.PropToPartName(prop);
            }
            else if (baseName === "gravitywell") {
                partName = MarbleRunSimulatorCore.GravityWell.PropToPartName(prop);
            }
            else if (baseName === "screen") {
                partName = MarbleRunSimulatorCore.Screen.PropToPartName(prop);
            }
            else if (baseName === "speeder") {
                partName = MarbleRunSimulatorCore.Speeder.PropToPartName(prop);
            }
            else if (baseName === "trikeSkull") {
                partName = MarbleRunSimulatorCore.TrikeSkull.PropToPartName(prop);
            }
            if (partName) {
                return this.getTemplate(partName, prop.mirrorX, prop.mirrorZ);
            }
        }
    }
    MarbleRunSimulatorCore.TemplateManager = TemplateManager;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class TrackPoint {
        constructor(template, position, dir, normal, tangentIn, tangentOut) {
            this.template = template;
            this.position = position;
            this.dir = dir;
            this.normal = normal;
            this.tangentIn = tangentIn;
            this.tangentOut = tangentOut;
            this.fixedNormal = false;
            this.fixedDir = false;
            this.fixedTangentIn = false;
            this.fixedTangentOut = false;
            this.summedLength = 0;
            if (normal) {
                this.fixedNormal = true;
            }
            else {
                this.fixedNormal = false;
                this.normal = BABYLON.Vector3.Up();
            }
            this.normal = this.normal.clone();
            if (dir) {
                this.fixedDir = true;
            }
            else {
                this.fixedDir = false;
                this.dir = BABYLON.Vector3.Right();
            }
            this.dir = this.dir.clone();
            if (tangentIn) {
                this.fixedTangentIn = true;
            }
            else {
                this.fixedTangentIn = false;
                this.tangentIn = 1;
            }
            if (tangentOut) {
                this.fixedTangentOut = true;
            }
            else {
                this.fixedTangentOut = false;
                this.tangentOut = 1;
            }
            let right = BABYLON.Vector3.Cross(this.normal, this.dir).normalize();
            BABYLON.Vector3.CrossToRef(this.dir, right, this.normal);
            this.normal.normalize();
        }
        setDir(dir) {
            if (dir) {
                this.fixedDir = true;
                this.dir = dir;
            }
            else {
                this.fixedDir = false;
                this.dir = BABYLON.Vector3.Right();
            }
            this.dir = this.dir.clone();
            let right = BABYLON.Vector3.Cross(this.normal, this.dir).normalize();
            BABYLON.Vector3.CrossToRef(this.dir, right, this.normal);
            this.normal.normalize();
        }
        isFirstOrLast() {
            let index = this.template.trackpoints.indexOf(this);
            if (index === 0 || index === this.template.trackpoints.length - 1) {
                return true;
            }
            return false;
        }
    }
    MarbleRunSimulatorCore.TrackPoint = TrackPoint;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
/// <reference path="Track.ts"/>
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class WoodTrack extends MarbleRunSimulatorCore.Track {
        constructor(part) {
            super(part);
            this.tubeRadius = 0.01;
            this.tubePath = [];
            this.AABBMin = BABYLON.Vector3.Zero();
            this.AABBMax = BABYLON.Vector3.Zero();
            this.wires = [new MarbleRunSimulatorCore.Wire(this.part), new MarbleRunSimulatorCore.Wire(this.part)];
        }
        radiusToRaise(r) {
            return r - 0.003;
        }
        get preferedStartBank() {
            return 0;
        }
        get preferedEndBank() {
            return 0;
        }
        get trackIndex() {
            return this.part.tracks.indexOf(this);
        }
        getSlopeAt(index) {
            let trackpoint = this.template.trackpoints[index];
            let nextTrackPoint = this.template.trackpoints[index + 1];
            if (trackpoint) {
                if (nextTrackPoint) {
                    let dy = nextTrackPoint.position.y - trackpoint.position.y;
                    let dLength = nextTrackPoint.summedLength - trackpoint.summedLength;
                    return (dy / dLength) * 100;
                }
                else {
                    let angleToVertical = Mummu.Angle(BABYLON.Axis.Y, trackpoint.dir);
                    let angleToHorizontal = Math.PI / 2 - angleToVertical;
                    return Math.tan(angleToHorizontal) * 100;
                }
            }
            return 0;
        }
        getBankAt(index) {
            return 0;
        }
        initialize(template) {
            this.template = template;
            this.trackInterpolatedNormals = template.interpolatedNormals.map((v) => {
                return v.clone();
            });
            // Update AABB values.
            let N = this.templateInterpolatedPoints.length;
            this.AABBMin.copyFromFloats(Infinity, Infinity, Infinity);
            this.AABBMax.copyFromFloats(-Infinity, -Infinity, -Infinity);
            for (let i = 0; i < N; i++) {
                let p = this.templateInterpolatedPoints[i];
                this.AABBMin.minimizeInPlace(p);
                this.AABBMax.maximizeInPlace(p);
            }
            this.AABBMin.x -= (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMin.y -= (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMin.z -= (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMax.x += (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMax.y += (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMax.z += (this.part.wireSize + this.part.wireGauge) * 0.5;
            BABYLON.Vector3.TransformCoordinatesToRef(this.AABBMin, this.part.getWorldMatrix(), this.AABBMin);
            BABYLON.Vector3.TransformCoordinatesToRef(this.AABBMax, this.part.getWorldMatrix(), this.AABBMax);
        }
        recomputeWiresPath(forceDisconnexion) {
            let N = this.templateInterpolatedPoints.length;
            let angles = [...this.template.angles];
            angles = angles.map(a => { return 0; });
            let startBank = this.preferedStartBank;
            if (!forceDisconnexion) {
                let otherS = this.part.machine.getBankAt(this.startWorldPosition, this.part);
                if (otherS) {
                    this.part.addNeighbour(otherS.part);
                    startBank = 0;
                }
            }
            let endBank = this.preferedEndBank;
            if (!forceDisconnexion) {
                let otherE = this.part.machine.getBankAt(this.endWorldPosition, this.part);
                if (otherE) {
                    this.part.addNeighbour(otherE.part);
                    endBank = 0;
                }
            }
            for (let i = 0; i < N; i++) {
                let prevPoint = this.templateInterpolatedPoints[i - 1];
                let point = this.templateInterpolatedPoints[i];
                let nextPoint = this.templateInterpolatedPoints[i + 1];
                let dir;
                if (nextPoint) {
                    dir = nextPoint;
                }
                else {
                    dir = point;
                }
                if (prevPoint) {
                    dir = dir.subtract(prevPoint);
                }
                else {
                    dir = dir.subtract(point);
                }
                Mummu.RotateInPlace(this.trackInterpolatedNormals[i], dir, angles[i]);
            }
            // Compute wire path
            for (let i = 0; i < N; i++) {
                let pPrev = this.templateInterpolatedPoints[i - 1] ? this.templateInterpolatedPoints[i - 1] : undefined;
                let p = this.templateInterpolatedPoints[i];
                let pNext = this.templateInterpolatedPoints[i + 1] ? this.templateInterpolatedPoints[i + 1] : undefined;
                if (!pPrev) {
                    pPrev = p.subtract(pNext.subtract(p));
                }
                if (!pNext) {
                    pNext = p.add(p.subtract(pPrev));
                }
                let dir = pNext.subtract(pPrev).normalize();
                let up = this.trackInterpolatedNormals[i];
                let rotation = BABYLON.Quaternion.Identity();
                Mummu.QuaternionFromZYAxisToRef(dir, up, rotation);
                let matrix = BABYLON.Matrix.Compose(BABYLON.Vector3.One(), rotation, p);
                this.wires[0].path[i] = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(-this.part.wireGauge * 0.5, 0, 0), matrix);
                this.wires[1].path[i] = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(this.part.wireGauge * 0.5, 0, 0), matrix);
            }
            Mummu.DecimatePathInPlace(this.wires[0].path, (2 / 180) * Math.PI);
            Mummu.DecimatePathInPlace(this.wires[1].path, (2 / 180) * Math.PI);
            if (this.template.drawStartTip) {
                this.wires[0].startTipCenter = this.template.trackpoints[0].position.clone();
                this.wires[0].startTipNormal = this.template.trackpoints[0].normal.clone();
                this.wires[0].startTipDir = this.template.trackpoints[0].dir.clone();
            }
            if (this.template.drawEndTip) {
                this.wires[0].endTipCenter = this.template.trackpoints[this.template.trackpoints.length - 1].position.clone();
                this.wires[0].endTipNormal = this.template.trackpoints[this.template.trackpoints.length - 1].normal.clone();
                this.wires[0].endTipDir = this.template.trackpoints[this.template.trackpoints.length - 1].dir.clone();
            }
        }
        recomputeAbsolutePath() {
            let points = [...this.templateInterpolatedPoints].map((p) => {
                return p.clone();
            });
            let normals = [...this.trackInterpolatedNormals].map((p) => {
                return p.clone();
            });
            this.tubePath = points.map((pt, i) => {
                return pt.add(normals[i].scale(this.radiusToRaise(this.tubeRadius)));
            });
            for (let i = 0; i < this.tubePath.length; i++) {
                BABYLON.Vector3.TransformCoordinatesToRef(this.tubePath[i], this.part.getWorldMatrix(), this.tubePath[i]);
            }
        }
    }
    MarbleRunSimulatorCore.WoodTrack = WoodTrack;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class WoodTrackMeshBuilder {
        static async BuildWoodTrackMesh(track, props) {
            if (track.mesh) {
                track.mesh.dispose();
            }
            track.mesh = new BABYLON.Mesh("track-mesh");
            track.mesh.parent = track.part;
            track.mesh.material = track.part.game.materials.getMaterial(track.part.getColor(0), track.part.machine.materialQ);
            let r = track.tubeRadius;
            let thickLat = 1.3;
            let thickVert = 1.3;
            //let b = 0.0005;
            let points = [...track.templateInterpolatedPoints].map((p) => {
                return p.add(new BABYLON.Vector3(0, track.radiusToRaise(track.tubeRadius), 0));
            });
            Mummu.DecimatePathInPlace(points, (2 / 180) * Math.PI);
            let p0 = points[0];
            let p1 = points[1];
            let dirIn = p1.subtract(p0).normalize();
            dirIn.x = Math.round(dirIn.x);
            dirIn.y = Math.round(dirIn.y);
            dirIn.z = Math.round(dirIn.z);
            let pN1 = points[points.length - 2];
            let pN = points[points.length - 1];
            let dirOut = pN.subtract(pN1).normalize();
            dirOut.x = Math.round(dirOut.x);
            dirOut.y = Math.round(dirOut.y);
            dirOut.z = Math.round(dirOut.z);
            p0.addInPlace(dirIn.scale(0.0005));
            pN.subtractInPlace(dirOut.scale(0.0005));
            let shape = [];
            let shapeCap = [];
            /*
            shape.push(new BABYLON.Vector3(0, - thickVert * r - b, 0));
            shape.push(new BABYLON.Vector3(- thickLat * r + b, - thickVert * r - b, 0));
            shape.push(new BABYLON.Vector3(- thickLat * r - b, - thickVert * r + b, 0));
            shape.push(new BABYLON.Vector3(- thickLat * r - b, - b, 0));
            shape.push(new BABYLON.Vector3(- thickLat * r + b, b, 0));
            shape.push(new BABYLON.Vector3(- r - b, b, 0));
            for (let i = 0; i <= 6; i++) {
                let a = i / 6 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                let p = new BABYLON.Vector3(-cosa * r, - sina * r, 0);
                shape.push(p);
            }
            shape.push(new BABYLON.Vector3(r + b, b, 0));
            shape.push(new BABYLON.Vector3(thickLat * r - b, b, 0));
            shape.push(new BABYLON.Vector3(thickLat * r + b, - b, 0));
            shape.push(new BABYLON.Vector3(thickLat * r + b, - thickVert * r + b, 0));
            shape.push(new BABYLON.Vector3(thickLat * r - b, - thickVert * r - b, 0));
            */
            shape.push(new BABYLON.Vector3(0, -thickVert * r, 0));
            shape.push(new BABYLON.Vector3(-thickLat * r, -thickVert * r, 0));
            shape.push(new BABYLON.Vector3(-thickLat * r, -thickVert * r, 0));
            shape.push(new BABYLON.Vector3(-thickLat * r, 0, 0));
            shape.push(new BABYLON.Vector3(-thickLat * r, 0, 0));
            shape.push(new BABYLON.Vector3(-r, 0, 0));
            for (let i = 0; i <= 6; i++) {
                let a = i / 6 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                let p = new BABYLON.Vector3(-cosa * r, -sina * r, 0);
                shape.push(p);
            }
            shape.push(new BABYLON.Vector3(r, 0, 0));
            shape.push(new BABYLON.Vector3(thickLat * r, 0, 0));
            shape.push(new BABYLON.Vector3(thickLat * r, 0, 0));
            shape.push(new BABYLON.Vector3(thickLat * r, -thickVert * r, 0));
            shape.push(new BABYLON.Vector3(thickLat * r, -thickVert * r, 0));
            shape.push(new BABYLON.Vector3(0, -thickVert * r, 0));
            shapeCap.push(new BABYLON.Vector3(-thickLat * r, -thickVert * r, 0));
            shapeCap.push(new BABYLON.Vector3(-thickLat * r, 0, 0));
            for (let i = 0; i <= 6; i++) {
                let a = i / 6 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                let p = new BABYLON.Vector3(-cosa * r, -sina * r, 0);
                shapeCap.push(p);
            }
            shapeCap.push(new BABYLON.Vector3(thickLat * r, 0, 0));
            shapeCap.push(new BABYLON.Vector3(thickLat * r, -thickVert * r, 0));
            console.log(shapeCap.length);
            let t = shape.length;
            let positions = [];
            let indices = [];
            let uvs = [];
            let normals = [];
            for (let i = 0; i < points.length; i++) {
                let dir;
                let prev = points[i - 1];
                let point = points[i];
                let next = points[i + 1];
                if (prev && next) {
                    dir = next.subtract(prev).normalize();
                }
                else if (next) {
                    dir = next.subtract(point);
                    dir.x = Math.sign(dir.x);
                    dir.y = 0;
                    dir.z = 0;
                }
                else if (prev) {
                    dir = point.subtract(prev);
                    dir.x = Math.sign(dir.x);
                    dir.y = 0;
                    dir.z = 0;
                }
                let q = Mummu.QuaternionFromZYAxis(dir, BABYLON.Vector3.Up());
                let m = BABYLON.Matrix.Compose(BABYLON.Vector3.One(), q, point);
                let idx0 = positions.length / 3;
                for (let n = 0; n <= t; n++) {
                    let sn = shape[n % shape.length].clone();
                    let sn1 = shape[(n + 1) % shape.length];
                    let tri = BABYLON.Vector3.DistanceSquared(sn, sn1) > 0;
                    let p = BABYLON.Vector3.TransformCoordinates(sn, m);
                    positions.push(p.x, p.y, p.z);
                    if (tri) {
                        if (i < points.length - 1) {
                            if (n < t) {
                                indices.push(idx0 + n, idx0 + n + (t + 1) + 1, idx0 + n + (t + 1));
                                indices.push(idx0 + n, idx0 + n + 1, idx0 + n + (t + 1) + 1);
                            }
                        }
                    }
                }
            }
            let capData = new BABYLON.VertexData();
            let capPositions = [];
            let capIndices = [];
            let capNormals = [];
            for (let i = 0; i < shapeCap.length; i++) {
                let p = shapeCap[i];
                capPositions.push(p.x, p.y, p.z);
                capNormals.push(0, 0, -1);
            }
            capIndices.push(0, 10, 5);
            capIndices.push(0, 5, 4);
            capIndices.push(0, 4, 3);
            capIndices.push(0, 3, 2);
            capIndices.push(0, 2, 1);
            capIndices.push(10, 6, 5);
            capIndices.push(10, 7, 6);
            capIndices.push(10, 8, 7);
            capIndices.push(10, 9, 8);
            capData.positions = capPositions;
            capData.indices = capIndices;
            capData.normals = capNormals;
            let startCapData = Mummu.CloneVertexData(capData);
            let q = Mummu.QuaternionFromZYAxis(dirIn, BABYLON.Vector3.Up());
            Mummu.RotateVertexDataInPlace(startCapData, q);
            Mummu.TranslateVertexDataInPlace(startCapData, p0);
            let endCapData = Mummu.CloneVertexData(capData);
            q = Mummu.QuaternionFromZYAxis(dirOut.scale(-1), BABYLON.Vector3.Up());
            Mummu.RotateVertexDataInPlace(endCapData, q);
            Mummu.TranslateVertexDataInPlace(endCapData, pN);
            let woodData = new BABYLON.VertexData();
            woodData.positions = positions;
            woodData.indices = indices;
            BABYLON.VertexData.ComputeNormals(positions, indices, normals);
            woodData.normals = normals;
            Mummu.MergeVertexDatas(woodData, startCapData, endCapData).applyToMesh(track.mesh);
        }
    }
    MarbleRunSimulatorCore.WoodTrackMeshBuilder = WoodTrackMeshBuilder;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    function AddLinesFromData(machine, baseName, prop, lines) {
        let template = machine.templateManager.getTemplateByProp(baseName, prop);
        if (template) {
            // Now draw into the miniature from the template.
            for (let t = 0; t < template.trackTemplates.length; t++) {
                let trackTemplate = template.trackTemplates[t];
                let drawnTrack = new MarbleRunSimulatorCore.MiniatureTrack();
                if (!trackTemplate.noMiniatureRender) {
                    for (let p = 0; p < trackTemplate.interpolatedPoints.length; p++) {
                        if (p % 3 === 0 || p === trackTemplate.interpolatedPoints.length - 1) {
                            let point = trackTemplate.interpolatedPoints[p].clone();
                            Mummu.RotateInPlace(point, BABYLON.Axis.Y, -Math.PI * 0.5 * prop.r);
                            point.x += prop.i * MarbleRunSimulatorCore.tileSize;
                            point.y += prop.k * MarbleRunSimulatorCore.tileHeight;
                            point.z += prop.j * MarbleRunSimulatorCore.tileSize;
                            drawnTrack.dist = Math.min(drawnTrack.dist, point.x + point.z - point.y);
                            if (Mummu.IsFinite(point)) {
                                drawnTrack.points.push(point);
                            }
                            else {
                                console.log("miniature fail for " + baseName);
                                debugger;
                            }
                        }
                    }
                }
                if (drawnTrack.points.length > 0) {
                    lines.push(drawnTrack);
                }
            }
            for (let j = 0; j < template.miniatureShapes.length; j++) {
                let shape = template.miniatureShapes[j];
                let drawnShape = new MarbleRunSimulatorCore.MiniatureShape();
                drawnShape.fill = shape.fill;
                for (let i = 0; i < shape.points.length; i++) {
                    let point = shape.points[i].clone();
                    Mummu.RotateInPlace(point, BABYLON.Axis.Y, -Math.PI * 0.5 * prop.r);
                    point.x += prop.i * MarbleRunSimulatorCore.tileSize;
                    point.y += prop.k * MarbleRunSimulatorCore.tileHeight;
                    point.z += prop.j * MarbleRunSimulatorCore.tileSize;
                    if (Mummu.IsFinite(point)) {
                        drawnShape.points.push(point);
                    }
                }
                if (drawnShape.points.length > 0) {
                    let center = shape.center.clone();
                    Mummu.RotateInPlace(center, BABYLON.Axis.Y, -Math.PI * 0.5 * prop.r);
                    center.x += prop.i * MarbleRunSimulatorCore.tileSize;
                    center.y += prop.k * MarbleRunSimulatorCore.tileHeight;
                    center.z += prop.j * MarbleRunSimulatorCore.tileSize;
                    drawnShape.dist = center.x + center.z - center.y;
                    lines.push(drawnShape);
                }
            }
        }
        else {
            console.log("can't find template for " + baseName);
        }
    }
    MarbleRunSimulatorCore.AddLinesFromData = AddLinesFromData;
    function DrawMiniature(data, lines, canvas) {
        let picSize = 512;
        let picMargin = picSize / 20;
        let picSizeNoMargin = picSize - 2 * picMargin;
        let lineWidth = 2;
        canvas.width = picSize;
        canvas.height = picSize;
        let backGroundColor = BABYLON.Color3.FromHexString("#000000");
        if (data.v === 10) {
            backGroundColor = BABYLON.Color3.FromHexString("#103c6f");
        }
        if (data.v === 8) {
            backGroundColor = BABYLON.Color3.FromHexString("#106f26");
        }
        if (data.v === 6) {
            backGroundColor = BABYLON.Color3.FromHexString("#6f1610");
        }
        if (data.v === 2) {
            backGroundColor = BABYLON.Color3.FromHexString("#3f106f");
        }
        let backGroundColorHex = backGroundColor.toHexString();
        let context = canvas.getContext("2d");
        context.fillStyle = backGroundColorHex;
        context.fillRect(0, 0, canvas.width, canvas.height);
        let xProjAxis = new BABYLON.Vector2(Math.cos(Math.PI / 6), Math.sin(Math.PI / 6));
        let yProjAxis = new BABYLON.Vector2(0, 1);
        let zProjAxis = new BABYLON.Vector2(-Math.cos(Math.PI / 6), Math.sin(Math.PI / 6));
        let vToX = (v) => {
            let x = xProjAxis.x * v.x + yProjAxis.x * v.y + zProjAxis.x * v.z;
            return x;
        };
        let vToY = (v) => {
            let y = xProjAxis.y * v.x + yProjAxis.y * v.y + zProjAxis.y * v.z;
            return y;
        };
        let aabbMin = new BABYLON.Vector3(Infinity, Infinity, Infinity);
        let aabbMax = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);
        let abstractPixelXMin = Infinity;
        let abstractPixelXMax = -Infinity;
        let abstractPixelYMin = Infinity;
        let abstractPixelYMax = -Infinity;
        lines.sort((a, b) => { return b.dist - a.dist; });
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].points;
            for (let j = 0; j < line.length; j++) {
                let p = line[j];
                if (Mummu.IsFinite(p)) {
                    let abstractPixelX = vToX(p);
                    let abstractPixelY = vToY(p);
                    abstractPixelXMin = Math.min(abstractPixelXMin, abstractPixelX);
                    abstractPixelXMax = Math.max(abstractPixelXMax, abstractPixelX);
                    abstractPixelYMin = Math.min(abstractPixelYMin, abstractPixelY);
                    abstractPixelYMax = Math.max(abstractPixelYMax, abstractPixelY);
                    aabbMin = BABYLON.Vector3.Minimize(aabbMin, p);
                    aabbMax = BABYLON.Vector3.Maximize(aabbMax, p);
                }
            }
        }
        let w = abstractPixelXMax - abstractPixelXMin;
        let h = abstractPixelYMax - abstractPixelYMin;
        let s = Math.max(w, h);
        let mx = picMargin;
        let my = picMargin;
        if (w > h) {
            my = (picSize - h / s * picSizeNoMargin) * 0.5;
        }
        else if (h > w) {
            mx = (picSize - w / s * picSizeNoMargin) * 0.5;
        }
        let framePoints = [
            new BABYLON.Vector3(aabbMin.x - 0.01, aabbMin.y, aabbMin.z - 0.01),
            new BABYLON.Vector3(aabbMax.x + 0.01, aabbMin.y, aabbMin.z - 0.01),
            new BABYLON.Vector3(aabbMax.x + 0.01, aabbMin.y, aabbMax.z + 0.01),
            new BABYLON.Vector3(aabbMin.x - 0.01, aabbMin.y, aabbMax.z + 0.01)
        ];
        let cFrameLine = BABYLON.Color3.Lerp(backGroundColor, BABYLON.Color3.White(), 0.5);
        context.beginPath();
        let p0 = framePoints[0];
        let x = (vToX(p0) - abstractPixelXMin) / s * picSizeNoMargin + mx;
        let y = (vToY(p0) - abstractPixelYMin) / s * picSizeNoMargin + my;
        context.moveTo(x - 2, picSize - y - 2);
        for (let j = 1; j < framePoints.length; j++) {
            let p = framePoints[j];
            let x = (vToX(p) - abstractPixelXMin) / s * picSizeNoMargin + mx;
            let y = (vToY(p) - abstractPixelYMin) / s * picSizeNoMargin + my;
            context.lineTo(x - 2, picSize - y - 2);
        }
        context.closePath();
        context.strokeStyle = cFrameLine.toHexString();
        context.lineWidth = 1;
        context.stroke();
        let cFrameBackground = BABYLON.Color3.Lerp(backGroundColor, BABYLON.Color3.White(), 0.05);
        context.fillStyle = cFrameBackground.toHexString();
        context.fill();
        let dist01 = BABYLON.Vector3.Distance(framePoints[0], framePoints[1]);
        let dist03 = BABYLON.Vector3.Distance(framePoints[0], framePoints[3]);
        let count01 = 10;
        let count03 = 10;
        if (dist01 > dist03) {
            count03 = Math.round(dist03 / (dist01 / count01));
        }
        if (dist03 > dist01) {
            count01 = Math.round(dist01 / (dist03 / count03));
        }
        for (let i = 1; i < count01; i++) {
            let f = i / count01;
            let p0 = BABYLON.Vector3.Lerp(framePoints[0], framePoints[1], f);
            let p1 = BABYLON.Vector3.Lerp(framePoints[3], framePoints[2], f);
            context.beginPath();
            let x = (vToX(p0) - abstractPixelXMin) / s * picSizeNoMargin + mx;
            let y = (vToY(p0) - abstractPixelYMin) / s * picSizeNoMargin + my;
            context.moveTo(x - 2, picSize - y - 2);
            x = (vToX(p1) - abstractPixelXMin) / s * picSizeNoMargin + mx;
            y = (vToY(p1) - abstractPixelYMin) / s * picSizeNoMargin + my;
            context.lineTo(x - 2, picSize - y - 2);
            context.strokeStyle = cFrameLine.toHexString();
            context.lineWidth = 1;
            context.stroke();
        }
        for (let i = 1; i < count03; i++) {
            let f = i / count03;
            let p0 = BABYLON.Vector3.Lerp(framePoints[0], framePoints[3], f);
            let p1 = BABYLON.Vector3.Lerp(framePoints[1], framePoints[2], f);
            context.beginPath();
            let x = (vToX(p0) - abstractPixelXMin) / s * picSizeNoMargin + mx;
            let y = (vToY(p0) - abstractPixelYMin) / s * picSizeNoMargin + my;
            context.moveTo(x - 2, picSize - y - 2);
            x = (vToX(p1) - abstractPixelXMin) / s * picSizeNoMargin + mx;
            y = (vToY(p1) - abstractPixelYMin) / s * picSizeNoMargin + my;
            context.lineTo(x - 2, picSize - y - 2);
            context.strokeStyle = cFrameLine.toHexString();
            context.lineWidth = 1;
            context.stroke();
        }
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            context.lineWidth = 5 * lineWidth;
            let normalizedH = 0;
            context.beginPath();
            let p0 = line.points[0];
            let x = (vToX(p0) - abstractPixelXMin) / s * picSizeNoMargin + mx;
            let y = (vToY(p0) - abstractPixelYMin) / s * picSizeNoMargin + my;
            normalizedH = p0.y;
            //console.log("p0 " + x + " " + y);
            context.moveTo(x - 2, picSize - y - 2);
            for (let j = 1; j < line.points.length; j++) {
                let p = line.points[j];
                let x = (vToX(p) - abstractPixelXMin) / s * picSizeNoMargin + mx;
                let y = (vToY(p) - abstractPixelYMin) / s * picSizeNoMargin + my;
                normalizedH += p.y;
                //console.log("p " + x + " " + y);
                context.lineTo(x - 2, picSize - y - 2);
            }
            normalizedH = normalizedH / line.points.length;
            normalizedH = (normalizedH - aabbMin.y) / (aabbMax.y - aabbMin.y);
            let f = normalizedH * 0.8 + 0.2;
            if (line instanceof MarbleRunSimulatorCore.MiniatureTrack) {
                let c = BABYLON.Color3.Lerp(backGroundColor, BABYLON.Color3.White(), f);
                context.strokeStyle = c.toHexString();
                context.stroke();
                context.lineWidth = 3 * lineWidth;
                context.strokeStyle = backGroundColorHex;
                context.stroke();
            }
            else if (line instanceof MarbleRunSimulatorCore.MiniatureShape) {
                let c = BABYLON.Color3.Lerp(backGroundColor, BABYLON.Color3.White(), 1);
                context.closePath();
                context.strokeStyle = c.toHexString();
                context.lineWidth = lineWidth;
                context.stroke();
                if (line.fill) {
                    c = BABYLON.Color3.Lerp(backGroundColor, BABYLON.Color3.White(), 0.7 * f);
                    context.fillStyle = c.toHexString();
                    context.fill();
                }
            }
        }
        context.font = "20px monospace";
        context.fillStyle = "white";
        context.fillText("v" + data.v.toFixed(0), 5, 25);
    }
    MarbleRunSimulatorCore.DrawMiniature = DrawMiniature;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    function SerializeV1(machine) {
        let data = {
            name: machine.name,
            author: machine.author,
            balls: [],
            parts: [],
        };
        for (let i = 0; i < machine.balls.length; i++) {
            data.balls.push({
                x: machine.balls[i].positionZero.x,
                y: machine.balls[i].positionZero.y,
                z: machine.balls[i].positionZero.z,
            });
        }
        for (let i = 0; i < machine.parts.length; i++) {
            data.parts.push({
                name: machine.parts[i].partName,
                i: machine.parts[i].i,
                j: machine.parts[i].j,
                k: machine.parts[i].k,
                mirrorX: machine.parts[i].mirrorX,
                mirrorZ: machine.parts[i].mirrorZ,
                c: machine.parts[i].colors,
            });
        }
        return data;
    }
    MarbleRunSimulatorCore.SerializeV1 = SerializeV1;
    function DeserializeV1(machine, data) {
        if (data.name) {
            machine.name = data.name;
        }
        if (data.author) {
            machine.author = data.author;
        }
        machine.balls = [];
        machine.parts = [];
        for (let i = 0; i < data.balls.length; i++) {
            let ballData = data.balls[i];
            let ball = new MarbleRunSimulatorCore.Ball(new BABYLON.Vector3(ballData.x, ballData.y, isFinite(ballData.z) ? ballData.z : 0), machine);
            machine.balls.push(ball);
        }
        for (let i = 0; i < data.parts.length; i++) {
            let part = data.parts[i];
            let prop = {
                i: part.i * 2,
                j: part.j,
                k: part.k,
                mirrorX: part.mirrorX,
                mirrorZ: part.mirrorZ,
            };
            if (typeof part.c === "number") {
                prop.c = [part.c];
            }
            else if (part.c) {
                prop.c = part.c;
            }
            let track = machine.trackFactory.createTrack(part.name, prop);
            if (track) {
                if (data.sleepers) {
                    track.sleepersMeshProp = data.sleepers;
                }
                machine.parts.push(track);
            }
        }
    }
    MarbleRunSimulatorCore.DeserializeV1 = DeserializeV1;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    function SerializeV11(machine) {
        let data = {
            n: machine.name,
            a: machine.author,
            v: 11,
            r: machine.roomIndex
        };
        let dataString = "";
        // Add ball count
        dataString += MarbleRunSimulatorCore.NToHex(machine.balls.length, 2);
        for (let i = 0; i < machine.balls.length; i++) {
            let ball = machine.balls[i];
            let x = Math.round(ball.positionZero.x * 1000) + MarbleRunSimulatorCore.ballOffset;
            let y = Math.round(ball.positionZero.y * 1000) + MarbleRunSimulatorCore.ballOffset;
            let z = Math.round(ball.positionZero.z * 1000) + MarbleRunSimulatorCore.ballOffset;
            dataString += MarbleRunSimulatorCore.NToHex(x, 3);
            dataString += MarbleRunSimulatorCore.NToHex(y, 3);
            dataString += MarbleRunSimulatorCore.NToHex(z, 3);
            dataString += MarbleRunSimulatorCore.NToHex(ball.materialIndex, 2);
        }
        // Add parts count
        dataString += MarbleRunSimulatorCore.NToHex(machine.parts.length, 2);
        for (let i = 0; i < machine.parts.length; i++) {
            let partDataString = "";
            let part = machine.parts[i];
            let baseName = part.partName.split("_")[0];
            let index = MarbleRunSimulatorCore.TrackNames.findIndex((name) => {
                return name.startsWith(baseName);
            });
            if (index === -1) {
                console.error("Error, can't find part index.");
                debugger;
            }
            partDataString += MarbleRunSimulatorCore.NToHex(index, 2);
            let pI = part.i + MarbleRunSimulatorCore.partOffset;
            let pJ = part.j + MarbleRunSimulatorCore.partOffset;
            let pK = part.k + MarbleRunSimulatorCore.partOffset;
            let pR = part.r;
            partDataString += MarbleRunSimulatorCore.NToHex(pI, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(pJ, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(pK, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(pR, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.w + MarbleRunSimulatorCore.partOffset, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(part.h + MarbleRunSimulatorCore.partOffset, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(part.d + MarbleRunSimulatorCore.partOffset, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(part.n, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.s, 1);
            let m = (part.mirrorX ? 1 : 0) + (part.mirrorZ ? 2 : 0);
            partDataString += MarbleRunSimulatorCore.NToHex(m, 1);
            let colourCount = part.colors.length;
            partDataString += MarbleRunSimulatorCore.NToHex(colourCount, 1);
            for (let j = 0; j < part.colors.length; j++) {
                let c = part.colors[j];
                partDataString += MarbleRunSimulatorCore.NToHex(c, 1);
            }
            //console.log("---------------------------");
            //console.log("serialize");
            //console.log(part);
            //console.log("into");
            //console.log(partDataString);
            //console.log("---------------------------");
            dataString += partDataString;
        }
        dataString += MarbleRunSimulatorCore.NToHex(machine.decors.length, 2);
        for (let i = 0; i < machine.decors.length; i++) {
            let decor = machine.decors[i];
            let x = Math.round(decor.position.x * 1000) + MarbleRunSimulatorCore.ballOffset;
            let y = Math.round(decor.position.y * 1000) + MarbleRunSimulatorCore.ballOffset;
            let z = Math.round(decor.position.z * 1000) + MarbleRunSimulatorCore.ballOffset;
            dataString += MarbleRunSimulatorCore.NToHex(x, 3);
            dataString += MarbleRunSimulatorCore.NToHex(y, 3);
            dataString += MarbleRunSimulatorCore.NToHex(z, 3);
            dataString += MarbleRunSimulatorCore.NToHex(decor.n, 2);
            dataString += MarbleRunSimulatorCore.NToHex(decor.flip ? 1 : 0, 1);
        }
        data.d = dataString;
        data.sp = machine.sleepersMeshProp;
        return data;
    }
    MarbleRunSimulatorCore.SerializeV11 = SerializeV11;
    function DeserializeAnte11Fix(baseName, prop) {
        if (!isFinite(prop.r)) {
            prop.r = 0;
        }
        if (baseName === "shooter") {
            prop.k -= prop.h + 1;
            if (prop.mirrorX) {
                prop.r = 2;
            }
        }
        if (baseName === "elevator") {
            prop.k -= prop.h + 1;
            if (prop.mirrorX) {
                prop.i += 3;
                prop.r = 2;
            }
        }
        if (baseName === "uturn") {
            let newL = (prop.d - 1) * 3;
            if (prop.mirrorX) {
                if (prop.d === 2) {
                    prop.i += 1;
                }
                if (prop.d === 3) {
                    prop.i += 4;
                }
                if (prop.d === 4) {
                    prop.i += 7;
                }
                if (prop.d === 5) {
                    prop.i += 10;
                }
                if (prop.d === 6) {
                    prop.i += 13;
                }
                if (prop.d === 7) {
                    prop.i += 16;
                }
                if (prop.mirrorZ) {
                    prop.k -= prop.h;
                }
                else {
                    prop.h = -prop.h;
                }
                prop.r = 2;
            }
            else {
                prop.i--;
                prop.j -= newL;
                if (prop.mirrorZ) {
                    prop.h = -prop.h;
                }
                else {
                    prop.k -= prop.h;
                }
            }
            prop.l = newL;
        }
        if (baseName === "wall") {
            let newL = (prop.d - 1) * 3;
            if (prop.mirrorX) {
                prop.i += 4;
                prop.r = 2;
            }
            else {
                prop.i--;
                prop.j -= newL;
            }
            prop.k -= prop.h;
            prop.l = newL;
        }
        if (baseName === "loop") {
            //console.log("n " + prop.n);
            //console.log("mirrorX " + prop.mirrorX);
            //console.log("mirrorZ " + prop.mirrorZ);
            prop.l = prop.l * 3;
            prop.d = (prop.d - 1) * 3;
            prop.k -= 4;
            if (prop.mirrorX) {
                if (prop.mirrorZ) {
                }
                else {
                    prop.i--;
                    prop.j -= prop.d;
                }
            }
            else {
                prop.i--;
                if (prop.mirrorZ) {
                }
                else {
                    prop.d = -prop.d;
                }
            }
        }
        if (baseName === "split") {
            prop.k -= 1;
            if (prop.mirrorX) {
                prop.r = 2;
            }
        }
        if (baseName === "stairway") {
            prop.l = prop.l * 3;
            prop.h = prop.h - 2;
            prop.k -= prop.h;
            if (prop.mirrorX) {
                prop.r = 2;
                prop.i += prop.l - 3;
            }
        }
        if (baseName === "screw") {
            prop.l = prop.l * 3;
            prop.k -= prop.h;
            if (prop.mirrorX) {
                prop.r = 2;
                prop.i += prop.l - 3;
            }
        }
        if (baseName === "spiral") {
            prop.i--;
            prop.l = 3 * prop.l;
            if (prop.mirrorX) {
                if (prop.mirrorZ) {
                    prop.i += prop.l - 1;
                    prop.j -= prop.l;
                    prop.r = 2;
                }
                else {
                    prop.l = -prop.l;
                }
            }
            else {
                if (prop.mirrorZ) {
                    prop.r = 2;
                    prop.i += prop.l - 1;
                    prop.j -= prop.l;
                    prop.l = -prop.l;
                }
            }
        }
        if (baseName === "spiralUTurn") {
            prop.l = 3 * (prop.d - 1);
            if (prop.mirrorX) {
                if (prop.mirrorZ) {
                    prop.r = 2;
                    prop.i += prop.l - 2;
                    prop.j -= prop.l;
                    prop.l = -prop.l;
                }
                else {
                    prop.r = 2;
                    prop.i += prop.l + 1;
                }
            }
            else {
                prop.i--;
                if (prop.mirrorZ) {
                    prop.j -= prop.l;
                }
                else {
                    prop.l = -prop.l;
                }
            }
        }
        if (baseName === "speeder") {
            prop.l = 3;
            prop.i--;
        }
        if (baseName === "join") {
            if (prop.mirrorX) {
                prop.r = 2;
            }
        }
        if (baseName === "screen") {
            if (prop.mirrorX) {
                prop.r = 2;
            }
        }
        if (baseName === "start") {
            if (prop.mirrorX) {
                prop.r = 2;
            }
        }
        if (baseName === "jumper") {
            if (prop.mirrorX) {
                prop.i += 3;
                prop.r = 2;
            }
        }
        if (baseName === "forwardSplit") {
            if (prop.mirrorX) {
                prop.r = 2;
                prop.j -= 6;
            }
        }
        if (baseName === "uturnsharp") {
            prop.k -= prop.h;
            if (prop.mirrorX) {
                prop.r = 2;
                if (prop.h === 1) {
                    prop.i -= 2;
                }
                if (prop.h === 2) {
                    prop.i -= 2;
                }
                if (prop.h === 3) {
                }
                else if (prop.h === 9) {
                    prop.i += 6;
                }
                else if (prop.h === 11) {
                    prop.i += 7;
                }
                else {
                    prop.i += 2 + Math.floor((prop.h + 1) / 5);
                }
            }
        }
        if (baseName === "ramp" || baseName === "piperamp" || baseName === "woodramp" || baseName === "wave") {
            prop.l = prop.l * 3;
            prop.d = (prop.d - 1) * 3;
            if (prop.mirrorX) {
                prop.i -= 1;
                prop.k -= prop.h;
                if (prop.mirrorZ) {
                    prop.d = -prop.d;
                }
                else {
                    prop.j -= prop.d;
                }
            }
            else {
                prop.i -= 1;
                prop.h = -prop.h;
                if (prop.mirrorZ) {
                    prop.j -= prop.d;
                }
                else {
                    prop.d = -prop.d;
                }
            }
        }
    }
    MarbleRunSimulatorCore.DeserializeAnte11Fix = DeserializeAnte11Fix;
    function DeserializeAnte11AltitudeFix(machine) {
        let minK = Infinity;
        for (let i = 0; i < machine.parts.length; i++) {
            let part = machine.parts[i];
            if (part.downwardYExtendable) {
                minK = Math.min(minK, part.k - part.h);
            }
            else {
                minK = Math.min(minK, part.k);
            }
        }
        if (isFinite(minK) && minK != 0) {
            for (let i = 0; i < machine.parts.length; i++) {
                let part = machine.parts[i];
                part.setK(part.k - minK);
            }
            for (let i = 0; i < machine.balls.length; i++) {
                let ball = machine.balls[i];
                ball.setPositionZero(ball.positionZero.subtract(new BABYLON.Vector3(0, minK * MarbleRunSimulatorCore.tileHeight, 0)));
            }
        }
    }
    MarbleRunSimulatorCore.DeserializeAnte11AltitudeFix = DeserializeAnte11AltitudeFix;
    function DeserializeV11(machine, data, makeMiniature = false, canvas) {
        let dataString = data.d;
        if (dataString) {
            if (data.n) {
                machine.name = data.n;
            }
            if (data.a) {
                machine.author = data.a;
            }
            machine.balls = [];
            machine.parts = [];
            let lines = [];
            let pt = 0;
            let ballCount = parseInt(dataString.substring(pt, pt += 2), 36);
            //console.log("ballCount = " + ballCount);
            for (let i = 0; i < ballCount; i++) {
                let x = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let materialIndex = parseInt(dataString.substring(pt, pt += 2), 36);
                if (makeMiniature) {
                }
                else {
                    let ball = new MarbleRunSimulatorCore.Ball(new BABYLON.Vector3(x, y, z), machine);
                    machine.balls.push(ball);
                    ball.materialIndex = materialIndex;
                }
            }
            let partCount = parseInt(dataString.substring(pt, pt += 2), 36);
            console.log("partCount = " + partCount);
            for (let i = 0; i < partCount; i++) {
                let index = parseInt(dataString.substring(pt, pt += 2), 36);
                if (index >= 0 && index < MarbleRunSimulatorCore.TrackNames.length) {
                    let baseName = MarbleRunSimulatorCore.TrackNames[index].split("_")[0];
                    let pI = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let pK = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let pR = parseInt(dataString.substring(pt, pt += 1), 36);
                    //console.log("part ijk " + pI + " " + pJ + " " + pK);
                    let l = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let h = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let d = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let n = parseInt(dataString.substring(pt, pt += 1), 36);
                    let s = parseInt(dataString.substring(pt, pt += 1), 36);
                    let mirror = parseInt(dataString.substring(pt, pt += 1), 36);
                    //console.log("part whdn " + w + " " + h + " " + d + " " + n);
                    let colorCount = parseInt(dataString.substring(pt, pt += 1), 36);
                    //console.log(colorCount);
                    let colors = [];
                    for (let ii = 0; ii < colorCount; ii++) {
                        colors[ii] = parseInt(dataString.substring(pt, pt += 1), 36);
                    }
                    let prop = {
                        i: pI,
                        j: pJ,
                        k: pK,
                        r: pR,
                        l: l,
                        h: h,
                        d: d,
                        n: n,
                        s: s,
                        mirrorX: (mirror % 2) === 1,
                        mirrorZ: mirror >= 2,
                        c: colors
                    };
                    if (makeMiniature) {
                        MarbleRunSimulatorCore.AddLinesFromData(machine, baseName, prop, lines);
                    }
                    else {
                        let track = machine.trackFactory.createTrackBaseName(baseName, prop);
                        if (track) {
                            machine.parts.push(track);
                        }
                        else {
                            console.warn("failed to createTrackBaseName");
                            console.log(baseName);
                            console.log(prop);
                        }
                    }
                }
            }
            let decorCount = parseInt(dataString.substring(pt, pt += 2), 36);
            for (let i = 0; i < decorCount; i++) {
                let x = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                if (makeMiniature) {
                }
                else {
                    let decor = new MarbleRunSimulatorCore.Xylophone(machine);
                    decor.setPosition(new BABYLON.Vector3(x, y, z));
                    machine.decors.push(decor);
                    let n = parseInt(dataString.substring(pt, pt += 2), 36);
                    decor.setN(n);
                    if (data.v === 8) {
                        let f = parseInt(dataString.substring(pt, pt += 1), 36) === 1 ? true : false;
                        decor.setFlip(f);
                    }
                }
            }
            if (data.r) {
                machine._roomIndex = data.r;
            }
            else {
                if (partCount % 2 === 0) {
                    machine._roomIndex = 0;
                }
                else if (partCount % 2 === 1) {
                    machine._roomIndex = 9;
                }
                else {
                    machine._roomIndex = 0;
                }
            }
            if (makeMiniature) {
                MarbleRunSimulatorCore.DrawMiniature(data, lines, canvas);
            }
        }
    }
    MarbleRunSimulatorCore.DeserializeV11 = DeserializeV11;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    function SerializeV12(machine) {
        let data = {
            title: machine.name,
            author: machine.author,
            v: 12
        };
        let dataString = "";
        // Add ball count
        dataString += MarbleRunSimulatorCore.NToHex(machine.balls.length, 2);
        for (let i = 0; i < machine.balls.length; i++) {
            let ball = machine.balls[i];
            let x = Math.round(ball.positionZero.x * 1000) + MarbleRunSimulatorCore.ballOffset;
            let y = Math.round(ball.positionZero.y * 1000) + MarbleRunSimulatorCore.ballOffset;
            let z = Math.round(ball.positionZero.z * 1000) + MarbleRunSimulatorCore.ballOffset;
            dataString += MarbleRunSimulatorCore.NToHex(x, 3);
            dataString += MarbleRunSimulatorCore.NToHex(y, 3);
            dataString += MarbleRunSimulatorCore.NToHex(z, 3);
            dataString += MarbleRunSimulatorCore.NToHex(ball.materialIndex, 2);
        }
        // Add parts count
        dataString += MarbleRunSimulatorCore.NToHex(machine.parts.length, 2);
        for (let i = 0; i < machine.parts.length; i++) {
            let partDataString = "";
            let part = machine.parts[i];
            let baseName = part.partName.split("_")[0];
            let index = MarbleRunSimulatorCore.TrackNames.findIndex((name) => {
                return name.startsWith(baseName);
            });
            if (index === -1) {
                console.error("Error, can't find part index.");
                debugger;
            }
            partDataString += MarbleRunSimulatorCore.NToHex(index, 2);
            let pI = part.i + MarbleRunSimulatorCore.partOffset;
            let pJ = part.j + MarbleRunSimulatorCore.partOffset;
            let pK = part.k + MarbleRunSimulatorCore.partOffset;
            let pR = part.r;
            partDataString += MarbleRunSimulatorCore.NToHex(pI, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(pJ, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(pK, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(pR, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.w + MarbleRunSimulatorCore.partOffset, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(part.h + MarbleRunSimulatorCore.partOffset, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(part.d + MarbleRunSimulatorCore.partOffset, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(part.n, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.s, 1);
            let m = (part.mirrorX ? 1 : 0) + (part.mirrorZ ? 2 : 0);
            partDataString += MarbleRunSimulatorCore.NToHex(m, 1);
            let colourCount = part.colors.length;
            partDataString += MarbleRunSimulatorCore.NToHex(colourCount, 1);
            for (let j = 0; j < part.colors.length; j++) {
                let c = part.colors[j];
                partDataString += MarbleRunSimulatorCore.NToHex(c, 1);
            }
            //console.log("---------------------------");
            //console.log("serialize");
            //console.log(part);
            //console.log("into");
            //console.log(partDataString);
            //console.log("---------------------------");
            dataString += partDataString;
        }
        dataString += MarbleRunSimulatorCore.NToHex(machine.decors.length, 2);
        for (let i = 0; i < machine.decors.length; i++) {
            let decor = machine.decors[i];
            let x = Math.round(decor.position.x * 1000) + MarbleRunSimulatorCore.ballOffset;
            let y = Math.round(decor.position.y * 1000) + MarbleRunSimulatorCore.ballOffset;
            let z = Math.round(decor.position.z * 1000) + MarbleRunSimulatorCore.ballOffset;
            dataString += MarbleRunSimulatorCore.NToHex(x, 3);
            dataString += MarbleRunSimulatorCore.NToHex(y, 3);
            dataString += MarbleRunSimulatorCore.NToHex(z, 3);
            dataString += MarbleRunSimulatorCore.NToHex(decor.n, 2);
            dataString += MarbleRunSimulatorCore.NToHex(decor.flip ? 1 : 0, 1);
        }
        dataString += MarbleRunSimulatorCore.NToHex(machine.roomIndex, 3);
        dataString += MarbleRunSimulatorCore.NToHex(machine.sleepersMeshProp.grndAnchors ? 1 : 0, 1);
        dataString += MarbleRunSimulatorCore.NToHex(Math.floor(machine.sleepersMeshProp.grndAnchorsMaxY * 100), 3);
        dataString += MarbleRunSimulatorCore.NToHex(Math.floor(machine.sleepersMeshProp.spacing * 100), 3);
        data.content = dataString;
        data.sp = machine.sleepersMeshProp;
        return data;
    }
    MarbleRunSimulatorCore.SerializeV12 = SerializeV12;
    function DeserializeV12(machine, data, makeMiniature = false, canvas) {
        let dataString = data.d;
        if (!dataString) {
            dataString = data.content;
        }
        if (dataString) {
            if (data.n) {
                machine.name = data.n;
            }
            if (data.title) {
                machine.name = data.title;
            }
            if (data.a) {
                machine.author = data.a;
            }
            if (data.author) {
                machine.author = data.author;
            }
            machine.balls = [];
            machine.parts = [];
            let lines = [];
            let pt = 0;
            let ballCount = parseInt(dataString.substring(pt, pt += 2), 36);
            //console.log("ballCount = " + ballCount);
            for (let i = 0; i < ballCount; i++) {
                let x = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let materialIndex = parseInt(dataString.substring(pt, pt += 2), 36);
                if (makeMiniature) {
                }
                else {
                    let ball = new MarbleRunSimulatorCore.Ball(new BABYLON.Vector3(x, y, z), machine);
                    machine.balls.push(ball);
                    ball.materialIndex = materialIndex;
                }
            }
            let partCount = parseInt(dataString.substring(pt, pt += 2), 36);
            console.log("partCount = " + partCount);
            for (let i = 0; i < partCount; i++) {
                let index = parseInt(dataString.substring(pt, pt += 2), 36);
                if (index >= 0 && index < MarbleRunSimulatorCore.TrackNames.length) {
                    let baseName = MarbleRunSimulatorCore.TrackNames[index].split("_")[0];
                    let pI = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let pK = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let pR = parseInt(dataString.substring(pt, pt += 1), 36);
                    //console.log("part ijk " + pI + " " + pJ + " " + pK);
                    let l = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let h = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let d = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let n = parseInt(dataString.substring(pt, pt += 1), 36);
                    let s = parseInt(dataString.substring(pt, pt += 1), 36);
                    let mirror = parseInt(dataString.substring(pt, pt += 1), 36);
                    //console.log("part whdn " + w + " " + h + " " + d + " " + n);
                    let colorCount = parseInt(dataString.substring(pt, pt += 1), 36);
                    //console.log(colorCount);
                    let colors = [];
                    for (let ii = 0; ii < colorCount; ii++) {
                        colors[ii] = parseInt(dataString.substring(pt, pt += 1), 36);
                    }
                    let prop = {
                        i: pI,
                        j: pJ,
                        k: pK,
                        r: pR,
                        l: l,
                        h: h,
                        d: d,
                        n: n,
                        s: s,
                        mirrorX: (mirror % 2) === 1,
                        mirrorZ: mirror >= 2,
                        c: colors
                    };
                    if (makeMiniature) {
                        let template = machine.templateManager.getTemplateByProp(baseName, prop);
                        if (template) {
                            // Now draw into the miniature from the template.
                            for (let t = 0; t < template.trackTemplates.length; t++) {
                                let trackTemplate = template.trackTemplates[t];
                                let drawnTrack = new MarbleRunSimulatorCore.MiniatureTrack();
                                /*
                                for (let p = 0; p < trackTemplate.trackpoints.length; p++) {
                                    let point = trackTemplate.trackpoints[p].position.clone();
                                    Mummu.RotateInPlace(point, BABYLON.Axis.Y, - Math.PI * 0.5 * prop.r);
                                    point.x += prop.i * tileSize;
                                    point.y += prop.k * tileHeight;
                                    point.z += prop.j * tileSize;
                                    if (Mummu.IsFinite(point)) {
                                        drawnTrack.push(point);
                                    }
                                    else {
                                        console.log("miniature fail for " + baseName);
                                    }
                                }
                                */
                                if (!trackTemplate.noMiniatureRender) {
                                    for (let p = 0; p < trackTemplate.interpolatedPoints.length; p++) {
                                        if (p % 3 === 0 || p === trackTemplate.interpolatedPoints.length - 1) {
                                            let point = trackTemplate.interpolatedPoints[p].clone();
                                            Mummu.RotateInPlace(point, BABYLON.Axis.Y, -Math.PI * 0.5 * prop.r);
                                            point.x += prop.i * MarbleRunSimulatorCore.tileSize;
                                            point.y += prop.k * MarbleRunSimulatorCore.tileHeight;
                                            point.z += prop.j * MarbleRunSimulatorCore.tileSize;
                                            drawnTrack.dist = Math.min(drawnTrack.dist, point.x + point.z - 0.5 * point.y);
                                            if (Mummu.IsFinite(point)) {
                                                drawnTrack.points.push(point);
                                            }
                                            else {
                                                console.log("miniature fail for " + baseName);
                                            }
                                        }
                                    }
                                }
                                if (drawnTrack.points.length > 0) {
                                    lines.push(drawnTrack);
                                }
                            }
                            for (let j = 0; j < template.miniatureShapes.length; j++) {
                                let shape = template.miniatureShapes[j];
                                let drawnShape = new MarbleRunSimulatorCore.MiniatureShape();
                                for (let i = 0; i < shape.points.length; i++) {
                                    let point = shape.points[i].clone();
                                    Mummu.RotateInPlace(point, BABYLON.Axis.Y, -Math.PI * 0.5 * prop.r);
                                    point.x += prop.i * MarbleRunSimulatorCore.tileSize;
                                    point.y += prop.k * MarbleRunSimulatorCore.tileHeight;
                                    point.z += prop.j * MarbleRunSimulatorCore.tileSize;
                                    drawnShape.dist = Math.min(drawnShape.dist, point.x + point.z - 0.5 * point.y);
                                    if (Mummu.IsFinite(point)) {
                                        drawnShape.points.push(point);
                                    }
                                }
                                if (drawnShape.points.length > 0) {
                                    lines.push(drawnShape);
                                }
                            }
                        }
                        else {
                            console.log("can't find template for " + baseName);
                        }
                    }
                    else {
                        let track = machine.trackFactory.createTrackBaseName(baseName, prop);
                        if (track) {
                            machine.parts.push(track);
                        }
                        else {
                            console.warn("failed to createTrackBaseName");
                            console.log(baseName);
                            console.log(prop);
                        }
                    }
                }
            }
            let decorCount = parseInt(dataString.substring(pt, pt += 2), 36);
            for (let i = 0; i < decorCount; i++) {
                let x = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                if (makeMiniature) {
                }
                else {
                    let decor = new MarbleRunSimulatorCore.Xylophone(machine);
                    decor.setPosition(new BABYLON.Vector3(x, y, z));
                    machine.decors.push(decor);
                    let n = parseInt(dataString.substring(pt, pt += 2), 36);
                    decor.setN(n);
                    if (data.v === 8) {
                        let f = parseInt(dataString.substring(pt, pt += 1), 36) === 1 ? true : false;
                        decor.setFlip(f);
                    }
                }
            }
            machine._roomIndex = parseInt(dataString.substring(pt, pt += 3), 36);
            let grndAnchors = parseInt(dataString.substring(pt, pt += 1), 36) === 1 ? true : false;
            let grndAnchorsMaxY = parseInt(dataString.substring(pt, pt += 3), 36) / 100;
            let spacing = parseInt(dataString.substring(pt, pt += 3), 36) / 100;
            machine.sleepersMeshProp = {
                grndAnchors: grndAnchors,
                grndAnchorsMaxY: grndAnchorsMaxY,
                spacing: spacing
            };
            if (makeMiniature) {
                MarbleRunSimulatorCore.DrawMiniature(data, lines, canvas);
            }
        }
    }
    MarbleRunSimulatorCore.DeserializeV12 = DeserializeV12;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    function SerializeV2(machine) {
        let data = {
            n: machine.name,
            a: machine.author,
            v: 2
        };
        let dataString = "";
        // Add ball count
        dataString += MarbleRunSimulatorCore.NToHex(machine.balls.length, 2);
        for (let i = 0; i < machine.balls.length; i++) {
            let ball = machine.balls[i];
            let x = Math.round(ball.positionZero.x * 1000) + MarbleRunSimulatorCore.ballOffset;
            let y = Math.round(ball.positionZero.y * 1000) + MarbleRunSimulatorCore.ballOffset;
            let z = Math.round(ball.positionZero.z * 1000) + MarbleRunSimulatorCore.ballOffset;
            dataString += MarbleRunSimulatorCore.NToHex(x, 3);
            dataString += MarbleRunSimulatorCore.NToHex(y, 3);
            dataString += MarbleRunSimulatorCore.NToHex(z, 3);
        }
        // Add parts count
        dataString += MarbleRunSimulatorCore.NToHex(machine.parts.length, 2);
        for (let i = 0; i < machine.parts.length; i++) {
            let partDataString = "";
            let part = machine.parts[i];
            let baseName = part.partName.split("_")[0];
            let index = MarbleRunSimulatorCore.TrackNames.findIndex((name) => {
                return name.startsWith(baseName);
            });
            if (index === -1) {
                console.error("Error, can't find part index.");
                debugger;
            }
            partDataString += MarbleRunSimulatorCore.NToHex(index, 2);
            let pI = part.i + MarbleRunSimulatorCore.partOffset;
            let pJ = part.j + MarbleRunSimulatorCore.partOffset;
            let pK = part.k + MarbleRunSimulatorCore.partOffset;
            partDataString += MarbleRunSimulatorCore.NToHex(pI, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(pJ, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(pK, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(part.w, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.h, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.d, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.n, 1);
            let m = (part.mirrorX ? 1 : 0) + (part.mirrorZ ? 2 : 0);
            partDataString += MarbleRunSimulatorCore.NToHex(m, 1);
            let colourCount = part.colors.length;
            partDataString += MarbleRunSimulatorCore.NToHex(colourCount, 1);
            for (let j = 0; j < part.colors.length; j++) {
                let c = part.colors[j];
                partDataString += MarbleRunSimulatorCore.NToHex(c, 1);
            }
            //console.log("---------------------------");
            //console.log("serialize");
            //console.log(part);
            //console.log("into");
            //console.log(partDataString);
            //console.log("---------------------------");
            dataString += partDataString;
        }
        data.d = dataString;
        return data;
    }
    MarbleRunSimulatorCore.SerializeV2 = SerializeV2;
    function DeserializeV2(machine, data, makeMiniature = false, canvas) {
        let dataString = data.d;
        if (!dataString) {
            dataString = data.content;
        }
        if (dataString) {
            if (makeMiniature) {
            }
            else if (machine) {
                if (data.n) {
                    machine.name = data.n;
                }
                if (data.a) {
                    machine.author = data.a;
                }
            }
            machine.balls = [];
            machine.parts = [];
            let lines = [];
            let pt = 0;
            let ballCount = parseInt(dataString.substring(pt, pt += 2), 36);
            //console.log("ballCount = " + ballCount);
            for (let i = 0; i < ballCount; i++) {
                let x = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                x = x / 0.075 * MarbleRunSimulatorCore.tileWidth;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                y = y / 0.03 * MarbleRunSimulatorCore.tileHeight;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                z = z / 0.06 * MarbleRunSimulatorCore.tileDepth;
                if (makeMiniature) {
                }
                else if (machine) {
                    let ball = new MarbleRunSimulatorCore.Ball(new BABYLON.Vector3(x, y, z), machine);
                    machine.balls.push(ball);
                }
            }
            let partCount = parseInt(dataString.substring(pt, pt += 2), 36);
            //console.log("partCount = " + partCount);
            for (let i = 0; i < partCount; i++) {
                let index = parseInt(dataString.substring(pt, pt += 2), 36);
                let baseName = MarbleRunSimulatorCore.TrackNames[index].split("_")[0];
                //console.log("basename " + baseName);
                let pI = (parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset) * 2;
                let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                let pK = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                //console.log("part ijk " + pI + " " + pJ + " " + pK);
                let w = (parseInt(dataString.substring(pt, pt += 1), 36)) * 2;
                let h = parseInt(dataString.substring(pt, pt += 1), 36);
                let d = parseInt(dataString.substring(pt, pt += 1), 36);
                let n = parseInt(dataString.substring(pt, pt += 1), 36);
                let mirror = parseInt(dataString.substring(pt, pt += 1), 36);
                //console.log("part whdn " + w + " " + h + " " + d + " " + n);
                let colorCount = parseInt(dataString.substring(pt, pt += 1), 36);
                //console.log(colorCount);
                let colors = [];
                for (let ii = 0; ii < colorCount; ii++) {
                    colors[ii] = parseInt(dataString.substring(pt, pt += 1), 36);
                }
                let prop = {
                    i: pI * 3,
                    j: pJ,
                    k: pK * 3,
                    l: w,
                    h: h,
                    d: d,
                    n: n,
                    s: MarbleRunSimulatorCore.TrackSpeed.Medium,
                    mirrorX: (mirror % 2) === 1,
                    mirrorZ: mirror >= 2,
                    c: colors
                };
                MarbleRunSimulatorCore.DeserializeAnte11Fix(baseName, prop);
                if (makeMiniature) {
                    MarbleRunSimulatorCore.AddLinesFromData(machine, baseName, prop, lines);
                }
                else if (machine) {
                    let track = machine.trackFactory.createTrackBaseName(baseName, prop);
                    if (track) {
                        machine.parts.push(track);
                    }
                }
            }
            if (makeMiniature) {
                MarbleRunSimulatorCore.DrawMiniature(data, lines, canvas);
            }
            else if (machine) {
                MarbleRunSimulatorCore.DeserializeAnte11AltitudeFix(machine);
            }
        }
    }
    MarbleRunSimulatorCore.DeserializeV2 = DeserializeV2;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    function SerializeV3456(machine, version) {
        let data = {
            n: machine.name,
            a: machine.author,
            v: version
        };
        let dataString = "";
        // Add ball count
        dataString += MarbleRunSimulatorCore.NToHex(machine.balls.length, 2);
        for (let i = 0; i < machine.balls.length; i++) {
            let ball = machine.balls[i];
            let x = Math.round(ball.positionZero.x * 1000) + MarbleRunSimulatorCore.ballOffset;
            let y = Math.round(ball.positionZero.y * 1000) + MarbleRunSimulatorCore.ballOffset;
            let z = Math.round(ball.positionZero.z * 1000) + MarbleRunSimulatorCore.ballOffset;
            dataString += MarbleRunSimulatorCore.NToHex(x, 3);
            dataString += MarbleRunSimulatorCore.NToHex(y, 3);
            dataString += MarbleRunSimulatorCore.NToHex(z, 3);
            if (version === 4 || version >= 6) {
                dataString += MarbleRunSimulatorCore.NToHex(ball.materialIndex, 2);
            }
        }
        // Add parts count
        dataString += MarbleRunSimulatorCore.NToHex(machine.parts.length, 2);
        for (let i = 0; i < machine.parts.length; i++) {
            let partDataString = "";
            let part = machine.parts[i];
            let baseName = part.partName.split("_")[0];
            let index = MarbleRunSimulatorCore.TrackNames.findIndex((name) => {
                return name.startsWith(baseName);
            });
            if (index === -1) {
                console.error("Error, can't find part index.");
                debugger;
            }
            partDataString += MarbleRunSimulatorCore.NToHex(index, 2);
            let pI = part.i + MarbleRunSimulatorCore.partOffset;
            let pJ = part.j + MarbleRunSimulatorCore.partOffset;
            let pK = part.k + MarbleRunSimulatorCore.partOffset;
            partDataString += MarbleRunSimulatorCore.NToHex(pI, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(pJ, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(pK, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(part.w, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.h, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.d, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.n, 1);
            let m = (part.mirrorX ? 1 : 0) + (part.mirrorZ ? 2 : 0);
            partDataString += MarbleRunSimulatorCore.NToHex(m, 1);
            let colourCount = part.colors.length;
            partDataString += MarbleRunSimulatorCore.NToHex(colourCount, 1);
            for (let j = 0; j < part.colors.length; j++) {
                let c = part.colors[j];
                partDataString += MarbleRunSimulatorCore.NToHex(c, 1);
            }
            //console.log("---------------------------");
            //console.log("serialize");
            //console.log(part);
            //console.log("into");
            //console.log(partDataString);
            //console.log("---------------------------");
            dataString += partDataString;
        }
        data.d = dataString;
        return data;
    }
    MarbleRunSimulatorCore.SerializeV3456 = SerializeV3456;
    function DeserializeV3456(machine, data, makeMiniature = false, canvas) {
        let dataString = data.d;
        if (!dataString) {
            dataString = data.content;
        }
        if (dataString) {
            if (makeMiniature) {
            }
            else if (machine) {
                if (data.n) {
                    machine.name = data.n;
                }
                if (data.title) {
                    machine.name = data.title;
                }
                if (data.a) {
                    machine.author = data.a;
                }
                if (data.author) {
                    machine.author = data.author;
                }
                if (data.r) {
                    machine._roomIndex = data.r;
                }
                else {
                    machine._roomIndex = 0;
                }
                machine.balls = [];
                machine.parts = [];
            }
            let lines = [];
            let pt = 0;
            let ballCount = parseInt(dataString.substring(pt, pt += 2), 36);
            for (let i = 0; i < ballCount; i++) {
                let x = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                x = x / 0.075 * MarbleRunSimulatorCore.tileWidth;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                y = y / 0.03 * MarbleRunSimulatorCore.tileHeight;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                z = z / 0.06 * MarbleRunSimulatorCore.tileDepth;
                let materialIndex = 0;
                if (data.v === 4 || data.v >= 6) {
                    materialIndex = parseInt(dataString.substring(pt, pt += 2), 36);
                }
                if (makeMiniature) {
                }
                else if (machine) {
                    let ball = new MarbleRunSimulatorCore.Ball(new BABYLON.Vector3(x, y, z), machine);
                    machine.balls.push(ball);
                    ball.materialIndex = materialIndex;
                }
            }
            let partCount = parseInt(dataString.substring(pt, pt += 2), 36);
            for (let i = 0; i < partCount; i++) {
                let index = parseInt(dataString.substring(pt, pt += 2), 36);
                let baseName = MarbleRunSimulatorCore.TrackNames[index].split("_")[0];
                let pI = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                let pK = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                let correctedPI = pI * 3;
                let correctedPJ = -pK * 3;
                let correctedPK = -pJ;
                let w = parseInt(dataString.substring(pt, pt += 1), 36);
                let h = parseInt(dataString.substring(pt, pt += 1), 36);
                let d = parseInt(dataString.substring(pt, pt += 1), 36);
                let n = parseInt(dataString.substring(pt, pt += 1), 36);
                let mirror = parseInt(dataString.substring(pt, pt += 1), 36);
                let colorCount = parseInt(dataString.substring(pt, pt += 1), 36);
                let colors = [];
                for (let ii = 0; ii < colorCount; ii++) {
                    colors[ii] = parseInt(dataString.substring(pt, pt += 1), 36);
                }
                if (data.v < 5) {
                    if (baseName === "uturn") {
                        if (d === 2) {
                            if ((mirror % 2) === 1) {
                                pI++;
                            }
                        }
                        if (d === 6 || d === 7) {
                            if ((mirror % 2) === 1) {
                                pI--;
                            }
                        }
                    }
                }
                let prop = {
                    i: correctedPI,
                    j: correctedPJ,
                    k: correctedPK,
                    l: w,
                    h: h,
                    d: d,
                    n: n,
                    s: MarbleRunSimulatorCore.TrackSpeed.Medium,
                    mirrorX: (mirror % 2) === 1,
                    mirrorZ: mirror >= 2,
                    c: colors
                };
                MarbleRunSimulatorCore.DeserializeAnte11Fix(baseName, prop);
                if (makeMiniature) {
                    MarbleRunSimulatorCore.AddLinesFromData(machine, baseName, prop, lines);
                }
                else if (machine) {
                    let track = machine.trackFactory.createTrackBaseName(baseName, prop);
                    if (track) {
                        machine.parts.push(track);
                    }
                    else {
                        console.warn("failed to createTrackBaseName");
                        console.log(baseName);
                        console.log(prop);
                    }
                }
            }
            if (makeMiniature) {
                MarbleRunSimulatorCore.DrawMiniature(data, lines, canvas);
            }
            else if (machine) {
                MarbleRunSimulatorCore.DeserializeAnte11AltitudeFix(machine);
            }
        }
    }
    MarbleRunSimulatorCore.DeserializeV3456 = DeserializeV3456;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    function SerializeV8(machine) {
        let data = {
            n: machine.name,
            a: machine.author,
            v: 8
        };
        let dataString = "";
        // Add ball count
        dataString += MarbleRunSimulatorCore.NToHex(machine.balls.length, 2);
        for (let i = 0; i < machine.balls.length; i++) {
            let ball = machine.balls[i];
            let x = Math.round(ball.positionZero.x * 1000) + MarbleRunSimulatorCore.ballOffset;
            let y = Math.round(ball.positionZero.y * 1000) + MarbleRunSimulatorCore.ballOffset;
            let z = Math.round(ball.positionZero.z * 1000) + MarbleRunSimulatorCore.ballOffset;
            dataString += MarbleRunSimulatorCore.NToHex(x, 3);
            dataString += MarbleRunSimulatorCore.NToHex(y, 3);
            dataString += MarbleRunSimulatorCore.NToHex(z, 3);
            dataString += MarbleRunSimulatorCore.NToHex(ball.materialIndex, 2);
        }
        // Add parts count
        dataString += MarbleRunSimulatorCore.NToHex(machine.parts.length, 2);
        for (let i = 0; i < machine.parts.length; i++) {
            let partDataString = "";
            let part = machine.parts[i];
            let baseName = part.partName.split("_")[0];
            let index = MarbleRunSimulatorCore.TrackNames.findIndex((name) => {
                return name.startsWith(baseName);
            });
            if (index === -1) {
                console.error("Error, can't find part index.");
                debugger;
            }
            partDataString += MarbleRunSimulatorCore.NToHex(index, 2);
            let pI = part.i + MarbleRunSimulatorCore.partOffset;
            let pJ = part.j + MarbleRunSimulatorCore.partOffset;
            let pK = part.k + MarbleRunSimulatorCore.partOffset;
            partDataString += MarbleRunSimulatorCore.NToHex(pI, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(pJ, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(pK, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(part.w, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.h, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.d, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.n, 1);
            let m = (part.mirrorX ? 1 : 0) + (part.mirrorZ ? 2 : 0);
            partDataString += MarbleRunSimulatorCore.NToHex(m, 1);
            let colourCount = part.colors.length;
            partDataString += MarbleRunSimulatorCore.NToHex(colourCount, 1);
            for (let j = 0; j < part.colors.length; j++) {
                let c = part.colors[j];
                partDataString += MarbleRunSimulatorCore.NToHex(c, 1);
            }
            //console.log("---------------------------");
            //console.log("serialize");
            //console.log(part);
            //console.log("into");
            //console.log(partDataString);
            //console.log("---------------------------");
            dataString += partDataString;
        }
        dataString += MarbleRunSimulatorCore.NToHex(machine.decors.length, 2);
        for (let i = 0; i < machine.decors.length; i++) {
            let decor = machine.decors[i];
            let x = Math.round(decor.position.x * 1000) + MarbleRunSimulatorCore.ballOffset;
            let y = Math.round(decor.position.y * 1000) + MarbleRunSimulatorCore.ballOffset;
            let z = Math.round(decor.position.z * 1000) + MarbleRunSimulatorCore.ballOffset;
            dataString += MarbleRunSimulatorCore.NToHex(x, 3);
            dataString += MarbleRunSimulatorCore.NToHex(y, 3);
            dataString += MarbleRunSimulatorCore.NToHex(z, 3);
            dataString += MarbleRunSimulatorCore.NToHex(decor.n, 2);
            dataString += MarbleRunSimulatorCore.NToHex(decor.flip ? 1 : 0, 1);
        }
        data.d = dataString;
        return data;
    }
    MarbleRunSimulatorCore.SerializeV8 = SerializeV8;
    function DeserializeV78(machine, data, makeMiniature = false, canvas) {
        let dataString = data.d;
        if (!dataString) {
            dataString = data.content;
        }
        if (dataString) {
            if (makeMiniature) {
            }
            else if (machine) {
                if (data.n) {
                    machine.name = data.n;
                }
                if (data.title) {
                    machine.name = data.title;
                }
                if (data.a) {
                    machine.author = data.a;
                }
                if (data.author) {
                    machine.author = data.author;
                }
                machine.balls = [];
                machine.parts = [];
            }
            let lines = [];
            let pt = 0;
            let ballCount = parseInt(dataString.substring(pt, pt += 2), 36);
            //console.log("ballCount = " + ballCount);
            for (let i = 0; i < ballCount; i++) {
                let x = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                x = x / 0.075 * MarbleRunSimulatorCore.tileWidth;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                y = y / 0.03 * MarbleRunSimulatorCore.tileHeight;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                z = z / 0.06 * MarbleRunSimulatorCore.tileDepth;
                let materialIndex = parseInt(dataString.substring(pt, pt += 2), 36);
                if (makeMiniature) {
                }
                else if (machine) {
                    let ball = new MarbleRunSimulatorCore.Ball(new BABYLON.Vector3(x, y, z), machine);
                    machine.balls.push(ball);
                    ball.materialIndex = materialIndex;
                }
            }
            let partCount = parseInt(dataString.substring(pt, pt += 2), 36);
            //console.log("partCount = " + partCount);
            for (let i = 0; i < partCount; i++) {
                let index = parseInt(dataString.substring(pt, pt += 2), 36);
                let baseName = MarbleRunSimulatorCore.TrackNames[index].split("_")[0];
                let pI = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                let pK = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                let correctedPI = pI * 3;
                let correctedPJ = -pK * 3;
                let correctedPK = -pJ;
                //console.log("part ijk " + pI + " " + pJ + " " + pK);
                let w = parseInt(dataString.substring(pt, pt += 1), 36);
                let h = parseInt(dataString.substring(pt, pt += 1), 36);
                let d = parseInt(dataString.substring(pt, pt += 1), 36);
                let n = parseInt(dataString.substring(pt, pt += 1), 36);
                let mirror = parseInt(dataString.substring(pt, pt += 1), 36);
                //console.log("part whdn " + w + " " + h + " " + d + " " + n);
                let colorCount = parseInt(dataString.substring(pt, pt += 1), 36);
                //console.log(colorCount);
                let colors = [];
                for (let ii = 0; ii < colorCount; ii++) {
                    colors[ii] = parseInt(dataString.substring(pt, pt += 1), 36);
                }
                let prop = {
                    i: correctedPI,
                    j: correctedPJ,
                    k: correctedPK,
                    l: w,
                    h: h,
                    d: d,
                    n: n,
                    s: MarbleRunSimulatorCore.TrackSpeed.Medium,
                    mirrorX: (mirror % 2) === 1,
                    mirrorZ: mirror >= 2,
                    c: colors
                };
                MarbleRunSimulatorCore.DeserializeAnte11Fix(baseName, prop);
                if (makeMiniature) {
                    MarbleRunSimulatorCore.AddLinesFromData(machine, baseName, prop, lines);
                }
                else if (machine) {
                    let track = machine.trackFactory.createTrackBaseName(baseName, prop);
                    if (track) {
                        machine.parts.push(track);
                    }
                    else {
                        console.warn("failed to createTrackBaseName");
                        console.log(baseName);
                        console.log(prop);
                    }
                }
            }
            let decorCount = parseInt(dataString.substring(pt, pt += 2), 36);
            for (let i = 0; i < decorCount; i++) {
                let x = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let f = false;
                if (data.v === 8) {
                    f = parseInt(dataString.substring(pt, pt += 1), 36) === 1 ? true : false;
                }
                if (makeMiniature) {
                }
                else if (machine) {
                    let decor = new MarbleRunSimulatorCore.Xylophone(machine);
                    decor.setPosition(new BABYLON.Vector3(x, y, z));
                    machine.decors.push(decor);
                    let n = parseInt(dataString.substring(pt, pt += 2), 36);
                    decor.setN(n);
                    decor.setFlip(f);
                }
            }
            if (makeMiniature) {
                MarbleRunSimulatorCore.DrawMiniature(data, lines, canvas);
            }
            else if (machine) {
                MarbleRunSimulatorCore.DeserializeAnte11AltitudeFix(machine);
            }
        }
    }
    MarbleRunSimulatorCore.DeserializeV78 = DeserializeV78;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    function SerializeV910(machine, version) {
        let data = {
            n: machine.name,
            a: machine.author,
            v: version,
            r: machine.roomIndex
        };
        let dataString = "";
        // Add ball count
        dataString += MarbleRunSimulatorCore.NToHex(machine.balls.length, 2);
        for (let i = 0; i < machine.balls.length; i++) {
            let ball = machine.balls[i];
            let x = Math.round(ball.positionZero.x * 1000) + MarbleRunSimulatorCore.ballOffset;
            let y = Math.round(ball.positionZero.y * 1000) + MarbleRunSimulatorCore.ballOffset;
            let z = Math.round(ball.positionZero.z * 1000) + MarbleRunSimulatorCore.ballOffset;
            dataString += MarbleRunSimulatorCore.NToHex(x, 3);
            dataString += MarbleRunSimulatorCore.NToHex(y, 3);
            dataString += MarbleRunSimulatorCore.NToHex(z, 3);
            dataString += MarbleRunSimulatorCore.NToHex(ball.materialIndex, 2);
        }
        // Add parts count
        dataString += MarbleRunSimulatorCore.NToHex(machine.parts.length, 2);
        for (let i = 0; i < machine.parts.length; i++) {
            let partDataString = "";
            let part = machine.parts[i];
            let baseName = part.partName.split("_")[0];
            let index = MarbleRunSimulatorCore.TrackNames.findIndex((name) => {
                return name.startsWith(baseName);
            });
            if (index === -1) {
                console.error("Error, can't find part index.");
                debugger;
            }
            partDataString += MarbleRunSimulatorCore.NToHex(index, 2);
            let pI = part.i + MarbleRunSimulatorCore.partOffset;
            let pJ = part.j + MarbleRunSimulatorCore.partOffset;
            let pK = part.k + MarbleRunSimulatorCore.partOffset;
            partDataString += MarbleRunSimulatorCore.NToHex(pI, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(pJ, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(pK, 2);
            partDataString += MarbleRunSimulatorCore.NToHex(part.w, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.h, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.d, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.n, 1);
            partDataString += MarbleRunSimulatorCore.NToHex(part.s, 1);
            let m = (part.mirrorX ? 1 : 0) + (part.mirrorZ ? 2 : 0);
            partDataString += MarbleRunSimulatorCore.NToHex(m, 1);
            let colourCount = part.colors.length;
            partDataString += MarbleRunSimulatorCore.NToHex(colourCount, 1);
            for (let j = 0; j < part.colors.length; j++) {
                let c = part.colors[j];
                partDataString += MarbleRunSimulatorCore.NToHex(c, 1);
            }
            //console.log("---------------------------");
            //console.log("serialize");
            //console.log(part);
            //console.log("into");
            //console.log(partDataString);
            //console.log("---------------------------");
            dataString += partDataString;
        }
        dataString += MarbleRunSimulatorCore.NToHex(machine.decors.length, 2);
        for (let i = 0; i < machine.decors.length; i++) {
            let decor = machine.decors[i];
            let x = Math.round(decor.position.x * 1000) + MarbleRunSimulatorCore.ballOffset;
            let y = Math.round(decor.position.y * 1000) + MarbleRunSimulatorCore.ballOffset;
            let z = Math.round(decor.position.z * 1000) + MarbleRunSimulatorCore.ballOffset;
            dataString += MarbleRunSimulatorCore.NToHex(x, 3);
            dataString += MarbleRunSimulatorCore.NToHex(y, 3);
            dataString += MarbleRunSimulatorCore.NToHex(z, 3);
            dataString += MarbleRunSimulatorCore.NToHex(decor.n, 2);
            dataString += MarbleRunSimulatorCore.NToHex(decor.flip ? 1 : 0, 1);
        }
        data.d = dataString;
        if (version === 10) {
            data.sp = machine.sleepersMeshProp;
        }
        return data;
    }
    MarbleRunSimulatorCore.SerializeV910 = SerializeV910;
    function DeserializeV910(machine, data, makeMiniature = false, canvas) {
        let dataString = data.d;
        if (!dataString) {
            dataString = data.content;
        }
        if (dataString) {
            if (makeMiniature) {
            }
            else if (machine) {
                if (data.n) {
                    machine.name = data.n;
                }
                if (data.title) {
                    machine.name = data.title;
                }
                if (data.a) {
                    machine.author = data.a;
                }
                if (data.author) {
                    machine.author = data.author;
                }
                if (data.v === 10) {
                    if (data.sp) {
                        machine.sleepersMeshProp = data.sp;
                    }
                }
                machine.balls = [];
                machine.parts = [];
            }
            let lines = [];
            let pt = 0;
            let ballCount = parseInt(dataString.substring(pt, pt += 2), 36);
            //console.log("ballCount = " + ballCount);
            for (let i = 0; i < ballCount; i++) {
                let x = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                x = x / 0.075 * MarbleRunSimulatorCore.tileWidth;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                y = y / 0.03 * MarbleRunSimulatorCore.tileHeight;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                z = z / 0.06 * MarbleRunSimulatorCore.tileDepth;
                let materialIndex = parseInt(dataString.substring(pt, pt += 2), 36);
                if (makeMiniature) {
                }
                else if (machine) {
                    let ball = new MarbleRunSimulatorCore.Ball(new BABYLON.Vector3(x, y, z), machine);
                    machine.balls.push(ball);
                    ball.materialIndex = materialIndex;
                }
            }
            let partCount = parseInt(dataString.substring(pt, pt += 2), 36);
            //console.log("partCount = " + partCount);
            for (let i = 0; i < partCount; i++) {
                let index = parseInt(dataString.substring(pt, pt += 2), 36);
                if (index >= 0 && index < MarbleRunSimulatorCore.TrackNames.length) {
                    let baseName = MarbleRunSimulatorCore.TrackNames[index].split("_")[0];
                    let pI = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let pK = parseInt(dataString.substring(pt, pt += 2), 36) - MarbleRunSimulatorCore.partOffset;
                    let correctedPI = pI * 3;
                    let correctedPJ = -pK * 3;
                    let correctedPK = -pJ;
                    //console.log("part ijk " + pI + " " + pJ + " " + pK);
                    let w = parseInt(dataString.substring(pt, pt += 1), 36);
                    let h = parseInt(dataString.substring(pt, pt += 1), 36);
                    let d = parseInt(dataString.substring(pt, pt += 1), 36);
                    let n = parseInt(dataString.substring(pt, pt += 1), 36);
                    let s = parseInt(dataString.substring(pt, pt += 1), 36);
                    let mirror = parseInt(dataString.substring(pt, pt += 1), 36);
                    //console.log("part whdn " + w + " " + h + " " + d + " " + n);
                    let colorCount = parseInt(dataString.substring(pt, pt += 1), 36);
                    //console.log(colorCount);
                    let colors = [];
                    for (let ii = 0; ii < colorCount; ii++) {
                        colors[ii] = parseInt(dataString.substring(pt, pt += 1), 36);
                    }
                    if (baseName === "spiralUTurn") {
                        if ((mirror % 2) === 1) {
                            if (d >= 3) {
                                correctedPI -= 3;
                            }
                        }
                    }
                    let prop = {
                        i: correctedPI,
                        j: correctedPJ,
                        k: correctedPK,
                        l: w,
                        h: h,
                        d: d,
                        n: n,
                        s: s,
                        mirrorX: (mirror % 2) === 1,
                        mirrorZ: mirror >= 2,
                        c: colors
                    };
                    MarbleRunSimulatorCore.DeserializeAnte11Fix(baseName, prop);
                    if (makeMiniature) {
                        MarbleRunSimulatorCore.AddLinesFromData(machine, baseName, prop, lines);
                    }
                    else if (machine) {
                        let track = machine.trackFactory.createTrackBaseName(baseName, prop);
                        if (track) {
                            machine.parts.push(track);
                        }
                        else {
                            console.warn("failed to createTrackBaseName");
                            console.log(baseName);
                            console.log(prop);
                        }
                    }
                }
            }
            let decorCount = parseInt(dataString.substring(pt, pt += 2), 36);
            for (let i = 0; i < decorCount; i++) {
                let x = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - MarbleRunSimulatorCore.ballOffset) / 1000;
                let n = parseInt(dataString.substring(pt, pt += 2), 36);
                let f = parseInt(dataString.substring(pt, pt += 1), 36) === 1 ? true : false;
                if (makeMiniature) {
                }
                else if (machine) {
                    let decor = new MarbleRunSimulatorCore.Xylophone(machine);
                    decor.setPosition(new BABYLON.Vector3(x, y, z));
                    machine.decors.push(decor);
                    decor.setN(n);
                    decor.setFlip(f);
                }
            }
            if (makeMiniature) {
                MarbleRunSimulatorCore.DrawMiniature(data, lines, canvas);
            }
            else if (machine) {
                MarbleRunSimulatorCore.DeserializeAnte11AltitudeFix(machine);
                if (data.r) {
                    machine._roomIndex = data.r;
                }
                else {
                    if (partCount % 2 === 0) {
                        machine._roomIndex = 0;
                    }
                    else if (partCount % 2 === 1) {
                        machine._roomIndex = 9;
                    }
                    else {
                        machine._roomIndex = 0;
                    }
                }
            }
            else {
            }
        }
    }
    MarbleRunSimulatorCore.DeserializeV910 = DeserializeV910;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class MachineDecorSelector extends BABYLON.Mesh {
        constructor(machineDecor, name) {
            super(name);
            this.machineDecor = machineDecor;
        }
    }
    MarbleRunSimulatorCore.MachineDecorSelector = MachineDecorSelector;
    class MachineDecor extends BABYLON.Mesh {
        constructor(machine, decorName) {
            super("decor");
            this.machine = machine;
            this.decorName = decorName;
            this.isPlaced = true;
            this._n = 0;
            this._flip = false;
            this.instantiated = false;
        }
        get n() {
            return this._n;
        }
        setN(v) {
            this._n = v;
            this.onNSet(this._n);
        }
        onNSet(n) { }
        get flip() {
            return this._flip;
        }
        setFlip(v) {
            if (this._flip != v) {
                this._flip = v;
                if (this.rotationQuaternion) {
                    let forward = this.forward.scale(-1);
                    let up = this.up;
                    this.setDirAndUp(forward, up);
                }
            }
        }
        setPosition(p) {
            this.position.x = Math.round(p.x * 1000) / 1000;
            this.position.y = Math.round(p.y * 1000) / 1000;
            this.position.z = Math.round(p.z * 1000) / 1000;
            this.freezeWorldMatrix();
            this.getChildMeshes().forEach((m) => {
                m.freezeWorldMatrix();
            });
            this.findMachinePart();
        }
        setDirAndUp(dir, up) {
            if (!this.rotationQuaternion) {
                this.rotationQuaternion = BABYLON.Quaternion.Identity();
            }
            Mummu.QuaternionFromYZAxisToRef(up, dir, this.rotationQuaternion);
            this.freezeWorldMatrix();
            this.getChildMeshes().forEach((m) => {
                m.freezeWorldMatrix();
            });
        }
        attachMachinePart(machinePart) {
            if (machinePart != this.machinePart) {
                if (this.machinePart) {
                    this.detachMachinePart();
                }
                this.machinePart = machinePart;
                if (machinePart) {
                    if (machinePart.decors.indexOf(this) === -1) {
                        machinePart.decors.push(this);
                    }
                }
            }
        }
        detachMachinePart() {
            if (this.machinePart) {
                let machinePart = this.machinePart;
                this.machinePart = undefined;
                let index = machinePart.decors.indexOf(this);
                if (index != -1) {
                    machinePart.decors.splice(index, 1);
                }
            }
        }
        findMachinePart() {
            let closest = Infinity;
            let closestMachinePart = undefined;
            for (let i = 0; i < this.machine.parts.length; i++) {
                let part = this.machine.parts[i];
                let p = BABYLON.Vector3.Zero();
                part.getProjection(this.position, p, BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero());
                let sqrDist = BABYLON.Vector3.DistanceSquared(this.position, p);
                if (sqrDist < closest) {
                    closest = sqrDist;
                    closestMachinePart = part;
                }
            }
            this.attachMachinePart(closestMachinePart);
        }
        async instantiate(hotReload) {
            this.instantiated = false;
            if (this.selectorMesh) {
                this.selectorMesh.dispose();
            }
            this.instantiateSelectorMesh();
            if (this.selectorMesh) {
                this.selectorMesh.visibility = 0;
                this.selectorMesh.parent = this;
                this.selectorMesh.freezeWorldMatrix();
            }
            await this.instantiateMachineDecorSpecific();
            this.findMachinePart();
            if (this.machinePart) {
                let up = BABYLON.Vector3.Up();
                let dir = BABYLON.Vector3.Right();
                this.machinePart.getProjection(this.position, BABYLON.Vector3.Zero(), dir, up);
                if (this.flip) {
                    dir.scaleInPlace(-1);
                }
                this.setDirAndUp(dir, up);
            }
            this.freezeWorldMatrix();
            this.instantiated = true;
        }
        dispose() {
            this.detachMachinePart();
            let index = this.machine.decors.indexOf(this);
            if (index > -1) {
                this.machine.decors.splice(index, 1);
            }
            super.dispose();
        }
        select() {
            if (this.selectorMesh) {
                this.selectorMesh.visibility = 0.2;
            }
        }
        unselect() {
            if (this.selectorMesh) {
                this.selectorMesh.visibility = 0;
            }
        }
        async instantiateMachineDecorSpecific() { }
        onBallCollideAABB(ball) { }
    }
    MarbleRunSimulatorCore.MachineDecor = MachineDecor;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class MachineDecorFactory {
        constructor(machine) {
            this.machine = machine;
        }
        createDecor(name) {
            if (name === "xylophone") {
                return new MarbleRunSimulatorCore.Xylophone(this.machine);
            }
        }
    }
    MarbleRunSimulatorCore.MachineDecorFactory = MachineDecorFactory;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
/// <reference path="MachineDecor.ts"/>
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Xylophone extends MarbleRunSimulatorCore.MachineDecor {
        constructor(machine) {
            super(machine, "xylophone");
            this._animateTrigger = Mummu.AnimationFactory.EmptyNumberCallback;
            this._animateTriggerBack = Mummu.AnimationFactory.EmptyNumberCallback;
            this.sounding = false;
            this._n = 12;
            this.trigger = new BABYLON.Mesh("trigger");
            this.trigger.position.y = 0.025;
            this.trigger.parent = this;
            this.blade = new BABYLON.Mesh("blade");
            this.blade.parent = this;
            this._animateTrigger = Mummu.AnimationFactory.CreateNumber(this, this.trigger.rotation, "x", () => {
                if (!this.machine.playing) {
                    this.trigger.rotation.x = 0;
                }
                this.trigger.freezeWorldMatrix();
                this.trigger.getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
            }, false);
            this._animateTriggerBack = Mummu.AnimationFactory.CreateNumber(this, this.trigger.rotation, "x", () => {
                if (!this.machine.playing) {
                    this.trigger.rotation.x = 0;
                }
                this.trigger.freezeWorldMatrix();
                this.trigger.getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
            }, false, Nabu.Easing.easeInSine);
        }
        get noteLetterIndex() {
            let note = Xylophone.NotesName[this.n];
            let letter = note[0];
            return "ABCDEFG".indexOf(letter);
        }
        instantiateSelectorMesh() {
            this.selectorMesh = new MarbleRunSimulatorCore.MachineDecorSelector(this, "xylophone-selector");
            let dataDisplay = BABYLON.CreateBoxVertexData({ size: 0.022 });
            Mummu.ColorizeVertexDataInPlace(dataDisplay, BABYLON.Color3.FromHexString("#00FFFF"));
            dataDisplay.applyToMesh(this.selectorMesh);
            this.selectorMesh.material = this.machine.game.materials.whiteFullLitMaterial;
        }
        async instantiateMachineDecorSpecific() {
            let data = await this.machine.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/xylophone.babylon");
            data[0].applyToMesh(this);
            this.material = this.machine.game.materials.getMaterial(0, this.machine.materialQ);
            data[1].applyToMesh(this.trigger);
            this.trigger.material = this.machine.game.materials.plasticWhite;
            data[2].applyToMesh(this.blade);
            this.blade.material = this.machine.game.materials.getMaterial(1, this.machine.materialQ);
            this.sound = new BABYLON.Sound("marble-bowl-inside-sound", "./lib/marble-run-simulator-core/datas/sounds/xylophone/A (" + (this.n + 1).toFixed(0) + ").mp3", this.getScene(), undefined, { loop: false, autoplay: false });
            this.sound.setVolume(1);
        }
        onNSet(n) {
            if (n > 0) {
                this.sound = new BABYLON.Sound("marble-bowl-inside-sound", "./lib/marble-run-simulator-core/datas/sounds/xylophone/A (" + (n + 1).toFixed(0) + ").mp3", this.getScene(), undefined, { loop: false, autoplay: false });
            }
        }
        async onBallCollideAABB(ball) {
            if (this.sounding) {
                return;
            }
            let dp = ball.position.subtract(this.position);
            let x = BABYLON.Vector3.Dot(dp, this.right);
            if (Math.abs(x) < 0.005) {
                let y = BABYLON.Vector3.Dot(dp, this.up);
                if (Math.abs(y) < 0.02) {
                    let z = BABYLON.Vector3.Dot(dp, this.forward);
                    if (z > -0.006 && z < 0.016) {
                        this.sounding = true;
                        await this._animateTrigger(-75 / 180 * Math.PI, 0.15 / this.machine.game.currentTimeFactor);
                        this.sound.setPlaybackRate(this.machine.game.currentTimeFactor);
                        this.sound.play();
                        if (this.onSoundPlay) {
                            this.onSoundPlay();
                        }
                        await this._animateTrigger(0, 0.5 / this.machine.game.currentTimeFactor);
                        this.sounding = false;
                    }
                }
            }
        }
    }
    Xylophone.NotesName = [
        "F4",
        "F4#",
        "G4",
        "G4#",
        "A5",
        "A5#",
        "B5",
        "C5",
        "C5#",
        "D5",
        "D5#",
        "E5",
        "F5",
        "F5#",
        "G5",
        "G5#",
        "A6",
        "A6#",
        "B6",
        "C6",
        "C6#",
        "D6",
        "D6#",
        "E6",
        "F6",
        "F6#",
        "G6",
        "G6#",
        "A7",
        "A7#",
        "B7",
        "C7",
        "C7#",
        "D7",
        "D7#",
        "E7",
        "F7",
        "F7#",
        "G7",
        "G7#",
        "A8",
        "A8#",
        "B8",
        "C8"
    ];
    MarbleRunSimulatorCore.Xylophone = Xylophone;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Controller extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this._animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;
            this.axisZMin = 0;
            this.axisZMax = 1;
            this.reset = () => {
                this._moving = false;
                if (this.mirrorX) {
                    this.pivotPass.rotation.z = -Math.PI / 4;
                }
                else {
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
            this._moving = false;
            this.setTemplate(this.machine.templateManager.getTemplate(Controller.PropToPartName(prop), prop.mirrorX));
            this.clicSound = new BABYLON.Sound("clic-sound", "./lib/marble-run-simulator-core/datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);
            for (let i = this.colors.length; i < 6; i++) {
                this.colors[i] = 0;
            }
            let rCurb = Controller.pivotL * 0.3;
            this.axisZMin = -this.wireGauge * 0.6 - 2 * MarbleRunSimulatorCore.tileSize;
            this.axisZMax = this.wireGauge * 0.6;
            this.pivotPass = new BABYLON.Mesh("pivotPass");
            this.pivotPass.position.copyFromFloats(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            this.pivotPass.parent = this;
            let dz = this.wireGauge * 0.5;
            this.cog13 = new BABYLON.Mesh("cog13");
            this.cog13.parent = this.pivotPass;
            this.pivotController = new BABYLON.Mesh("pivotController");
            this.pivotController.position.copyFromFloats(0, MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            this.pivotController.parent = this;
            this.pivotControllerCollider = new BABYLON.Mesh("collider-trigger");
            this.pivotControllerCollider.isVisible = false;
            this.pivotControllerCollider.parent = this.pivotController;
            this.cog8 = new BABYLON.Mesh("cog8");
            this.cog8.parent = this.pivotController;
            this.support = new BABYLON.Mesh("support");
            this.support.position.copyFromFloats(0, -MarbleRunSimulatorCore.tileHeight * 0.5, -MarbleRunSimulatorCore.tileSize);
            this.support.parent = this;
            let wireVertical0 = new MarbleRunSimulatorCore.Wire(this);
            wireVertical0.colorIndex = 5;
            wireVertical0.parent = this.pivotPass;
            wireVertical0.path = [new BABYLON.Vector3(0, Controller.pivotL, -dz - 2 * MarbleRunSimulatorCore.tileSize), new BABYLON.Vector3(0, -Controller.pivotL, -dz - 2 * MarbleRunSimulatorCore.tileSize)];
            let wireVertical1 = new MarbleRunSimulatorCore.Wire(this);
            wireVertical1.colorIndex = 5;
            wireVertical1.parent = this.pivotPass;
            wireVertical1.path = [new BABYLON.Vector3(0, Controller.pivotL, dz - 2 * MarbleRunSimulatorCore.tileSize), new BABYLON.Vector3(0, -Controller.pivotL, dz - 2 * MarbleRunSimulatorCore.tileSize)];
            this.wires = [wireVertical0, wireVertical1];
            this.generateWires();
            this._animatePivot = Mummu.AnimationFactory.CreateNumber(this, this.pivotPass.rotation, "z", () => {
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
            }, false, Nabu.Easing.easeInSquare);
            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }
        static PropToPartName(prop) {
            return "controller";
        }
        async instantiateMachineSpecific() {
            let q = Mummu.QuaternionFromYZAxis(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0));
            let axisPassVertexData = BABYLON.CreateCylinderVertexData({ height: MarbleRunSimulatorCore.tileSize + this.wireGauge * 1.2, diameter: 0.001 });
            Mummu.RotateVertexDataInPlace(axisPassVertexData, q);
            Mummu.TranslateVertexDataInPlace(axisPassVertexData, new BABYLON.Vector3(0, 0, -0.5 * MarbleRunSimulatorCore.tileSize));
            let axisControllerVertexData = BABYLON.CreateCylinderVertexData({ height: MarbleRunSimulatorCore.tileSize + this.wireGauge * 1.2, diameter: 0.001 });
            Mummu.RotateVertexDataInPlace(axisControllerVertexData, q);
            Mummu.TranslateVertexDataInPlace(axisControllerVertexData, new BABYLON.Vector3(0, MarbleRunSimulatorCore.tileHeight, 0.5 * MarbleRunSimulatorCore.tileSize));
            let supportData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 2);
            supportData = Mummu.MergeVertexDatas(axisControllerVertexData, axisPassVertexData, supportData);
            supportData.applyToMesh(this.support);
            this.support.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
            let cog8Data = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 0);
            cog8Data = Mummu.CloneVertexData(cog8Data);
            Mummu.TranslateVertexDataInPlace(cog8Data, new BABYLON.Vector3(0, 0, -MarbleRunSimulatorCore.tileSize));
            cog8Data.applyToMesh(this.cog8);
            this.cog8.material = this.game.materials.getMaterial(this.getColor(5), this.machine.materialQ);
            let cog13Data = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 1);
            cog13Data = Mummu.CloneVertexData(cog13Data);
            Mummu.TranslateVertexDataInPlace(cog13Data, new BABYLON.Vector3(0, 0, -MarbleRunSimulatorCore.tileSize));
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
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "controller";
            template.l = 1;
            template.h = 1;
            template.d = 2;
            template.mirrorX = mirrorX;
            template.xMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let pEndLeft = new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            pEndLeft.x -= Controller.pivotL / Math.SQRT2;
            pEndLeft.y += Controller.pivotL / Math.SQRT2;
            let pEndRight = new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            pEndRight.x += Controller.pivotL / Math.SQRT2;
            pEndRight.y += Controller.pivotL / Math.SQRT2;
            let dirEnd = MarbleRunSimulatorCore.Tools.V3Dir(115);
            let dirEndMirror = dirEnd.multiplyByFloats(-1, 1, 1);
            // Control
            // Control In Left
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], pEndLeft.subtract(dirEnd.scale(0.0005)), dirEnd)
            ];
            // Control In Right
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir.multiplyByFloats(-1, 1, 1)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], pEndRight.subtract(dirEnd.scale(0.0005).multiplyByFloats(-1, 1, 1)), dirEndMirror)
            ];
            // Control Out
            template.trackTemplates[2] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 0;
            template.trackTemplates[2].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5 - 0.015, -MarbleRunSimulatorCore.tileHeight * template.h + 0.001, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h + 0.001 + 0.015, 0), MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(-90))
            ];
            template.trackTemplates[2].drawEndTip = true;
            // Pass
            // Pass In
            template.trackTemplates[3] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[3].colorIndex = 2;
            template.trackTemplates[3].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, -2 * MarbleRunSimulatorCore.tileSize), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], pEndLeft.subtract(dirEnd.scale(0.0005)).subtractFromFloats(0, 0, 2 * MarbleRunSimulatorCore.tileSize), dirEnd)
            ];
            // Pass out Left
            template.trackTemplates[4] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[4].colorIndex = 2;
            template.trackTemplates[4].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, -2 * MarbleRunSimulatorCore.tileSize), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(-MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2, -MarbleRunSimulatorCore.tileHeight * 0.5 - MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2 - 0.001, -2 * MarbleRunSimulatorCore.tileSize), dirEnd.multiplyByFloats(1, -1, 1))
            ];
            // Pass out Right
            template.trackTemplates[5] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[5].colorIndex = 3;
            template.trackTemplates[5].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[5], new BABYLON.Vector3(MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2, -MarbleRunSimulatorCore.tileHeight * 0.5 - MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2 - 0.001, -2 * MarbleRunSimulatorCore.tileSize), dirEnd),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[5], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, -2 * MarbleRunSimulatorCore.tileSize), dir)
            ];
            // Shield
            template.trackTemplates[6] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[6].colorIndex = 4;
            template.trackTemplates[6].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[6], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.25, 0.016, -2 * MarbleRunSimulatorCore.tileSize), MarbleRunSimulatorCore.Tools.V3Dir(100), new BABYLON.Vector3(0, -1, 0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[6], new BABYLON.Vector3(0, 0.005, -2 * MarbleRunSimulatorCore.tileSize)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[6], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.25, 0.016, -2 * MarbleRunSimulatorCore.tileSize), MarbleRunSimulatorCore.Tools.V3Dir(80), new BABYLON.Vector3(0, -1, 0)),
            ];
            template.trackTemplates[6].drawStartTip = true;
            template.trackTemplates[6].drawEndTip = true;
            template.trackTemplates[6].noMiniatureRender = true;
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
            template.miniatureShapes.push(MarbleRunSimulatorCore.MiniatureShape.MakeNGon(new BABYLON.Vector3(0, MarbleRunSimulatorCore.tileHeight * 0.5, -MarbleRunSimulatorCore.tileSize - 0.003), MarbleRunSimulatorCore.tileHeight * 0.5, BABYLON.Axis.Z, 16, true));
            template.miniatureShapes.push(MarbleRunSimulatorCore.MiniatureShape.MakeNGon(new BABYLON.Vector3(0, MarbleRunSimulatorCore.tileHeight * 0.5, -MarbleRunSimulatorCore.tileSize + 0.003), MarbleRunSimulatorCore.tileHeight * 0.5, BABYLON.Axis.Z, 16, true));
            template.miniatureShapes.push(MarbleRunSimulatorCore.MiniatureShape.MakeNGon(new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5, -MarbleRunSimulatorCore.tileSize - 0.003), MarbleRunSimulatorCore.tileHeight * 0.5, BABYLON.Axis.Z, 16, true));
            template.miniatureShapes.push(MarbleRunSimulatorCore.MiniatureShape.MakeNGon(new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5, -MarbleRunSimulatorCore.tileSize + 0.003), MarbleRunSimulatorCore.tileHeight * 0.5, BABYLON.Axis.Z, 16, true));
            return template;
        }
        dispose() {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }
        update(dt) {
            super.update(dt);
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivotController.absolutePosition) < 0.05) {
                        let local = BABYLON.Vector3.TransformCoordinates(ball.position, this.pivotController.getWorldMatrix().clone().invert());
                        if (local.y < 0 && local.y > -0.03) {
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
                            }
                            else if (local.x < 0 && local.x > -ball.radius - 0.004) {
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
    Controller.pivotL = 0.014;
    MarbleRunSimulatorCore.Controller = Controller;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Curb extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.setTemplate(this.machine.templateManager.getTemplate(Curb.PropToPartName(prop)));
            this.generateWires();
        }
        static PropToPartName(prop) {
            let partName = (prop.pipeVersion ? "pipe" : "") + (prop.woodVersion ? "wood" : "") + "curb_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0) + "." + prop.s.toFixed(0);
            return partName;
        }
        static GenerateTemplate(l, h, s, pipeVersion, woodVersion) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = (pipeVersion ? "pipe" : "") + (woodVersion ? "wood" : "") + "curb_" + l.toFixed(0) + "." + h.toFixed(0) + "." + s.toFixed(0);
            template.l = l;
            template.h = h;
            template.s = s;
            template.lExtendableOnXZ = true;
            template.hExtendableOnY = true;
            template.sExtendable = true;
            template.minH = -32;
            template.maxH = 32;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].isPipe = pipeVersion;
            template.trackTemplates[0].isWood = woodVersion;
            let cx = -0.5 * MarbleRunSimulatorCore.tileSize;
            let cy = MarbleRunSimulatorCore.tileSize * template.l - 0.5 * MarbleRunSimulatorCore.tileSize;
            let r = MarbleRunSimulatorCore.tileSize * template.l - 0.5 * MarbleRunSimulatorCore.tileSize;
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cx + Math.sin(0) * r, 0, cy - Math.cos(0) * r), new BABYLON.Vector3(1, 0, 0))
            ];
            for (let n = 1; n < 4; n++) {
                let h = Nabu.Easing.easeInOutSine(n / 4) * MarbleRunSimulatorCore.tileHeight * template.h;
                template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cx + Math.sin(n / 4 * 0.5 * Math.PI) * r, h, cy - Math.cos(n / 4 * 0.5 * Math.PI) * r)));
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cx + Math.sin(Math.PI * 0.5) * r, MarbleRunSimulatorCore.tileHeight * template.h, cy - Math.cos(Math.PI * 0.5) * r), new BABYLON.Vector3(0, 0, 1)));
            template.maxAngle = Math.PI / 4 / 2 * template.s;
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.Curb = Curb;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Elevator extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.boxesCount = 4;
            this.rWheel = 0.015;
            this.boxX = [];
            this.boxes = [];
            this.wheels = [];
            this.reset = () => {
                for (let i = 0; i < this.boxesCount; i++) {
                    this.x = 0;
                    this.update(0);
                }
            };
            this.x = 0;
            this.length = 0;
            this.p = 0;
            this.chainLength = 0;
            this.speed = 0.04; // in m/s
            this.setTemplate(this.machine.templateManager.getTemplate(Elevator.PropToPartName(prop)));
            for (let i = this.colors.length; i < 4; i++) {
                this.colors[i] = 0;
            }
            let x = 1;
            this.wheels = [new BABYLON.Mesh("wheel-0"), new BABYLON.Mesh("wheel-1")];
            this.wheels[0].position.copyFromFloats(0.03 * x + MarbleRunSimulatorCore.tileWidth * 0.5, MarbleRunSimulatorCore.tileHeight * (this.h + 1) - MarbleRunSimulatorCore.tileHeight * (this.h + 0.35), 0);
            this.wheels[0].parent = this;
            this.wheels[1].position.copyFromFloats(0.03 * x + MarbleRunSimulatorCore.tileWidth * 0.5, MarbleRunSimulatorCore.tileHeight * this.h + 0.035, 0);
            this.wheels[1].parent = this;
            this.wires = [];
            this.length = Math.abs(this.wheels[1].position.y - this.wheels[0].position.y);
            this.p = 2 * Math.PI * this.rWheel;
            this.chainLength = 2 * this.length + this.p;
            this.boxesCount = Math.round(this.chainLength / 0.08);
            for (let i = 0; i < this.boxesCount; i++) {
                let box = new BABYLON.Mesh("box");
                box.rotationQuaternion = BABYLON.Quaternion.Identity();
                box.parent = this;
                let rRamp = this.wireGauge * 0.35;
                let nRamp = 12;
                let rampWire0 = new MarbleRunSimulatorCore.Wire(this);
                rampWire0.colorIndex = 2;
                rampWire0.path = [new BABYLON.Vector3(-0.02 * x, 0.0015, rRamp)];
                for (let i = 0; i <= nRamp * 0.5; i++) {
                    let a = (i / nRamp) * Math.PI;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);
                    rampWire0.path.push(new BABYLON.Vector3((sina * rRamp - rRamp - 0.0005) * x, 0, cosa * rRamp));
                }
                rampWire0.parent = box;
                let rampWire1 = new MarbleRunSimulatorCore.Wire(this);
                rampWire1.colorIndex = 2;
                rampWire1.path = [];
                for (let i = nRamp * 0.5; i <= nRamp; i++) {
                    let a = (i / nRamp) * Math.PI;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);
                    rampWire1.path.push(new BABYLON.Vector3((sina * rRamp - rRamp - 0.0005) * x, 0, cosa * rRamp));
                }
                rampWire1.path.push(new BABYLON.Vector3(-0.02 * x, 0.0015, -rRamp));
                rampWire1.parent = box;
                this.boxes.push(box);
                this.wires.push(rampWire0, rampWire1);
            }
            let rCable = 0.00075;
            let cablePerimeter = 2 * Math.PI * rCable;
            let nCable = 8;
            let cableShape = [];
            for (let i = 0; i < nCable; i++) {
                let a = (i / nCable) * 2 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                cableShape[i] = new BABYLON.Vector3(cosa * rCable, sina * rCable, 0);
            }
            let x0 = this.wheels[0].position.x;
            let y0 = this.wheels[0].position.y;
            let pathCable = [];
            for (let i = 0; i <= 16; i++) {
                let a = (i / 16) * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                pathCable.push(new BABYLON.Vector3(x0 + cosa * this.rWheel, y0 - sina * this.rWheel));
            }
            x0 = this.wheels[1].position.x;
            y0 = this.wheels[1].position.y;
            for (let i = 0; i < 16; i++) {
                let a = (i / 16) * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                pathCable.push(new BABYLON.Vector3(x0 - cosa * this.rWheel, y0 + sina * this.rWheel));
            }
            this.cable = new BABYLON.Mesh("cable");
            //this.cable = BABYLON.ExtrudeShape("wire", { shape: cableShape, path: pathCable, closeShape: true, closePath: true, updatable: true });
            //let data = BABYLON.VertexData.ExtractFromMesh(this.cable);
            //this.baseCableUVs = [...data.uvs];
            //for (let i = 0; i < this.baseCableUVs.length / 2; i++) {
            //    this.baseCableUVs[2 * i + 1] *= this.chainLength / cablePerimeter;
            //}
            //data.uvs = this.baseCableUVs;
            //data.applyToMesh(this.cable);
            let data2 = Mummu.CreateWireVertexData({ path: pathCable, radius: 0.00075, color: new BABYLON.Color4(1, 1, 1, 1), closed: true, textureRatio: 4 });
            this.baseCableUVs = [...data2.uvs];
            data2.applyToMesh(this.cable, true);
            this.cable.parent = this;
            this.generateWires();
            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }
        static PropToPartName(prop) {
            let partName = "elevator_" + prop.h.toFixed(0);
            return partName;
        }
        async instantiateMachineSpecific() {
            this.cable.material = this.game.materials.cableMaterial;
            let wheelData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/wheel.babylon", 0);
            wheelData.applyToMesh(this.wheels[0]);
            wheelData.applyToMesh(this.wheels[1]);
            this.wheels[0].material = this.game.materials.getMaterial(this.getColor(3), this.machine.materialQ);
            this.wheels[1].material = this.game.materials.getMaterial(this.getColor(3), this.machine.materialQ);
        }
        static GenerateTemplate(h) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "elevator_" + h.toFixed(0);
            template.l = 2;
            template.h = h;
            template.minH = 3;
            template.hExtendableOnY = true;
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
            let cupR = 0.008;
            let dH = 0.002;
            let vertX = MarbleRunSimulatorCore.tileWidth * 0.5 + 0.01 - cupR;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, MarbleRunSimulatorCore.tileHeight, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX - 1.6 * cupR, MarbleRunSimulatorCore.tileHeight - dH, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX - 0, MarbleRunSimulatorCore.tileHeight - dH - cupR * 0.6, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX + cupR, MarbleRunSimulatorCore.tileHeight - dH, 0), n),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX + cupR, MarbleRunSimulatorCore.tileHeight * h, 0), n),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX + cupR - 0.015, MarbleRunSimulatorCore.tileHeight * h + 0.035, 0), new BABYLON.Vector3(-1, 1, 0).normalize(), new BABYLON.Vector3(-1, -1, 0).normalize()),
            ];
            template.trackTemplates[0].drawEndTip = true;
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, MarbleRunSimulatorCore.tileHeight * h, 0), dirLeft),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-0.008 + MarbleRunSimulatorCore.tileWidth * 0.5, MarbleRunSimulatorCore.tileHeight * h + MarbleRunSimulatorCore.tileHeight * 0.5, 0), dirRight)
            ];
            template.maxAngle = Math.PI / 16;
            template.initialize();
            return template;
        }
        dispose() {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }
        update(dt) {
            super.update(dt);
            let dx = this.speed * dt * this.game.currentTimeFactor;
            let x = 1;
            if (this.mirrorX) {
                x = -1;
            }
            this.x += dx;
            while (this.x > this.chainLength) {
                this.x -= this.chainLength;
            }
            let rCable = 0.00075;
            let cablePerimeter = 2 * Math.PI * rCable;
            let newCablesUvs = [...this.baseCableUVs];
            for (let i = 0; i < newCablesUvs.length / 2; i++) {
                newCablesUvs[2 * i + 1] -= (this.x / cablePerimeter) / 4;
            }
            this.cable.setVerticesData(BABYLON.VertexBuffer.UVKind, newCablesUvs);
            for (let i = 0; i < this.boxesCount; i++) {
                this.boxX[i] = this.x + (i / this.boxesCount) * this.chainLength;
                while (this.boxX[i] > this.chainLength) {
                    this.boxX[i] -= this.chainLength;
                }
                if (this.boxX[i] < this.length) {
                    this.boxes[i].position.x = this.wheels[0].position.x - this.rWheel * x;
                    this.boxes[i].position.y = this.wheels[0].position.y + this.boxX[i];
                    Mummu.QuaternionFromXZAxisToRef(BABYLON.Axis.X, BABYLON.Axis.Z, this.boxes[i].rotationQuaternion);
                }
                else if (this.boxX[i] < this.length + 0.5 * this.p) {
                    let a = ((this.boxX[i] - this.length) / (0.5 * this.p)) * Math.PI;
                    this.boxes[i].position.x = this.wheels[1].position.x - Math.cos(a) * this.rWheel * x;
                    this.boxes[i].position.y = this.wheels[1].position.y + Math.sin(a) * this.rWheel;
                    let right = this.wheels[1].position.subtract(this.boxes[i].position).normalize();
                    Mummu.QuaternionFromXZAxisToRef(right.scale(x), BABYLON.Axis.Z, this.boxes[i].rotationQuaternion);
                }
                else if (this.boxX[i] < 2 * this.length + 0.5 * this.p) {
                    this.boxes[i].position.x = this.wheels[0].position.x + this.rWheel * x;
                    this.boxes[i].position.y = this.wheels[1].position.y - (this.boxX[i] - (this.length + 0.5 * this.p));
                    Mummu.QuaternionFromXZAxisToRef(BABYLON.Axis.X.scale(-1), BABYLON.Axis.Z, this.boxes[i].rotationQuaternion);
                }
                else {
                    let a = ((this.boxX[i] - (2 * this.length + 0.5 * this.p)) / (0.5 * this.p)) * Math.PI;
                    this.boxes[i].position.x = this.wheels[0].position.x + Math.cos(a) * this.rWheel * x;
                    this.boxes[i].position.y = this.wheels[0].position.y - Math.sin(a) * this.rWheel;
                    let right = this.wheels[0].position.subtract(this.boxes[i].position).normalize();
                    Mummu.QuaternionFromXZAxisToRef(right.scale(x), BABYLON.Axis.Z, this.boxes[i].rotationQuaternion);
                }
                this.boxes[i].freezeWorldMatrix();
                this.boxes[i].getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
                this.wires[2 * i].recomputeAbsolutePath();
                this.wires[2 * i + 1].recomputeAbsolutePath();
            }
            let deltaAngle = (dx / this.p) * 2 * Math.PI * x;
            this.wheels[0].rotation.z -= deltaAngle;
            this.wheels[0].freezeWorldMatrix();
            this.wheels[1].rotation.z -= deltaAngle;
            this.wheels[1].freezeWorldMatrix();
        }
    }
    MarbleRunSimulatorCore.Elevator = Elevator;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class End extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.setTemplate(this.machine.templateManager.getTemplate(End.PropToPartName(prop)));
            if (isNaN(this.colors[1])) {
                this.colors[1] = 0;
            }
            if (isNaN(this.colors[2])) {
                this.colors[2] = 17;
            }
            this.panel = new BABYLON.Mesh("panel");
            this.panel.position = new BABYLON.Vector3((this.mirrorX ? MarbleRunSimulatorCore.tileWidth * 0.6 : MarbleRunSimulatorCore.tileWidth * 0.4), -1.4 * MarbleRunSimulatorCore.tileHeight - 0.005, this.wireGauge * 0.5);
            this.panel.parent = this;
            this.panelSupport = new BABYLON.Mesh("panel-support");
            this.panelSupport.parent = this.panel;
            this.panelPicture = new BABYLON.Mesh("panel-picture");
            this.panelPicture.parent = this.panel;
            this.generateWires();
        }
        static PropToPartName(prop) {
            return "end";
        }
        async instantiateMachineSpecific() {
            let panelData = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/panel.babylon");
            panelData[0].applyToMesh(this.panel);
            this.panel.material = this.game.materials.getMaterial(this.getColor(2), this.machine.materialQ);
            panelData[1].applyToMesh(this.panelSupport);
            this.panelSupport.material = this.game.materials.getMaterial(this.getColor(1), this.machine.materialQ);
            panelData[2].applyToMesh(this.panelPicture);
            this.panelPicture.material = this.game.materials.getBallMaterial(this.game.materials.baseMaterialIndexToBallMaterialIndex(this.getColor(1)), this.machine.materialQ);
        }
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "end";
            template.l = 2;
            template.mirrorX = mirrorX;
            template.xMirrorable = true;
            let x0 = MarbleRunSimulatorCore.tileWidth * 0.4;
            let y0 = -1.4 * MarbleRunSimulatorCore.tileHeight;
            let w = MarbleRunSimulatorCore.tileWidth * 0.5;
            let r = 0.01;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(0, -0.01, 0), MarbleRunSimulatorCore.Tools.V3Dir(120))
            ];
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - w, y0 + 1.6 * r, 0), MarbleRunSimulatorCore.Tools.V3Dir(180), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - w, y0 + r, 0), MarbleRunSimulatorCore.Tools.V3Dir(180)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - w + r, y0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - 0.012, y0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - 0.001, y0 - 0.005, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0, y0 - 0.005, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + 0.001, y0 - 0.005, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + 0.012, y0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + w - r, y0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + w, y0 + r, 0), MarbleRunSimulatorCore.Tools.V3Dir(0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + w, y0 + 1.6 * r, 0), MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(-90)),
            ];
            template.trackTemplates[1].drawStartTip = true;
            template.trackTemplates[1].drawEndTip = true;
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.End = End;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class FlatJoin extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.setTemplate(this.machine.templateManager.getTemplate(FlatJoin.PropToPartName(prop), prop.mirrorX));
            for (let i = this.colors.length; i < 3; i++) {
                this.colors[i] = 0;
            }
            this.generateWires();
        }
        static PropToPartName(prop) {
            return "flatjoin";
        }
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "flatjoin";
            template.l = 1;
            template.mirrorX = mirrorX;
            template.xMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let dirJoin = MarbleRunSimulatorCore.Tools.V3Dir(120);
            let nJoin = MarbleRunSimulatorCore.Tools.V3Dir(30);
            let pEnd = new BABYLON.Vector3(-0.01, -MarbleRunSimulatorCore.tileHeight * 0.3, 0);
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight, 0), dir), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight, 0), dir)];
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], pEnd, dirJoin)];
            let r = 0.015;
            template.trackTemplates[2] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 2;
            template.trackTemplates[2].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], pEnd.add(nJoin.scale(r)), dirJoin, nJoin.scale(-1)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4, -MarbleRunSimulatorCore.tileHeight + r * 1.3, 0), MarbleRunSimulatorCore.Tools.V3Dir(90), MarbleRunSimulatorCore.Tools.V3Dir(180)),
            ];
            template.trackTemplates[2].drawStartTip = true;
            template.trackTemplates[2].drawEndTip = true;
            template.trackTemplates[2].noMiniatureRender = true;
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.FlatJoin = FlatJoin;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class ForwardSplit extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this._animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;
            this.axisZMin = 0;
            this.axisZMax = 1;
            this.reset = () => {
                this._exitLeft = !this.mirrorX && !this.mirrorZ;
                this._moving = false;
                if (this.mirrorX) {
                    this.pivot.rotation.z = -(this.mirrorZ ? -1 : 1) * Math.PI / 4;
                }
                else {
                    this.pivot.rotation.z = (this.mirrorZ ? -1 : 1) * Math.PI / 4;
                }
                this.pivot.freezeWorldMatrix();
                this.pivot.getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
            };
            this._exitLeft = true;
            this._moving = false;
            this.setTemplate(this.machine.templateManager.getTemplate(ForwardSplit.PropToPartName(prop)));
            this.clicSound = new BABYLON.Sound("clic-sound", "./lib/marble-run-simulator-core/datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);
            for (let i = this.colors.length; i < 5; i++) {
                this.colors[i] = 0;
            }
            let rCurb = MarbleRunSimulatorCore.Split.pivotL * 0.3;
            this.anchor = new BABYLON.Mesh("anchor");
            this.anchor.position.copyFromFloats(0, -MarbleRunSimulatorCore.tileHeight * 0.5, -MarbleRunSimulatorCore.tileDepth);
            this.anchor.rotation.y = -Math.PI * 0.5;
            this.anchor.parent = this;
            this.pivot = new BABYLON.Mesh("pivot");
            this.pivot.position.copyFromFloats(0, -MarbleRunSimulatorCore.tileHeight * 0.5, -MarbleRunSimulatorCore.tileDepth);
            this.pivot.rotation.y = -Math.PI * 0.5;
            this.pivot.parent = this;
            let dz = this.wireGauge * 0.5;
            let wireHorizontal0 = new MarbleRunSimulatorCore.Wire(this);
            wireHorizontal0.colorIndex = 4;
            wireHorizontal0.parent = this.pivot;
            wireHorizontal0.path = [new BABYLON.Vector3(-MarbleRunSimulatorCore.Split.pivotL, 0, -dz), new BABYLON.Vector3(MarbleRunSimulatorCore.Split.pivotL, 0, -dz)];
            let wireHorizontal1 = new MarbleRunSimulatorCore.Wire(this);
            wireHorizontal1.colorIndex = 4;
            wireHorizontal1.parent = this.pivot;
            wireHorizontal1.path = [new BABYLON.Vector3(-MarbleRunSimulatorCore.Split.pivotL, 0, dz), new BABYLON.Vector3(MarbleRunSimulatorCore.Split.pivotL, 0, dz)];
            let wireVertical0 = new MarbleRunSimulatorCore.Wire(this);
            wireVertical0.colorIndex = 4;
            wireVertical0.parent = this.pivot;
            wireVertical0.path = [new BABYLON.Vector3(0, MarbleRunSimulatorCore.Split.pivotL, -dz), new BABYLON.Vector3(0, rCurb * 0.3, -dz)];
            let wireVertical1 = new MarbleRunSimulatorCore.Wire(this);
            wireVertical1.colorIndex = 4;
            wireVertical1.parent = this.pivot;
            wireVertical1.path = [new BABYLON.Vector3(0, MarbleRunSimulatorCore.Split.pivotL, dz), new BABYLON.Vector3(0, rCurb * 0.3, dz)];
            let curbLeft0 = new MarbleRunSimulatorCore.Wire(this);
            curbLeft0.colorIndex = 4;
            curbLeft0.wireSize = this.wireSize * 0.8;
            curbLeft0.parent = this.pivot;
            curbLeft0.path = [];
            for (let i = 0; i <= 8; i++) {
                let a = ((Math.PI / 2) * i) / 8;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                curbLeft0.path.push(new BABYLON.Vector3(-rCurb + cosa * rCurb, rCurb - sina * rCurb, -dz));
            }
            let curbLeft1 = new MarbleRunSimulatorCore.Wire(this);
            curbLeft1.colorIndex = 4;
            curbLeft1.wireSize = this.wireSize * 0.8;
            curbLeft1.parent = this.pivot;
            curbLeft1.path = [];
            for (let i = 0; i <= 8; i++) {
                let a = ((Math.PI / 2) * i) / 8;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                curbLeft1.path.push(new BABYLON.Vector3(-rCurb + cosa * rCurb, rCurb - sina * rCurb, dz));
            }
            let curbRight0 = new MarbleRunSimulatorCore.Wire(this);
            curbRight0.colorIndex = 4;
            curbRight0.wireSize = this.wireSize * 0.8;
            curbRight0.parent = this.pivot;
            curbRight0.path = [];
            for (let i = 0; i <= 8; i++) {
                let a = ((Math.PI / 2) * i) / 8;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                curbRight0.path.push(new BABYLON.Vector3(rCurb - cosa * rCurb, rCurb - sina * rCurb, -dz));
            }
            let curbRight1 = new MarbleRunSimulatorCore.Wire(this);
            curbRight1.colorIndex = 4;
            curbRight1.wireSize = this.wireSize * 0.8;
            curbRight1.parent = this.pivot;
            curbRight1.path = [];
            for (let i = 0; i <= 8; i++) {
                let a = ((Math.PI / 2) * i) / 8;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                curbRight1.path.push(new BABYLON.Vector3(rCurb - cosa * rCurb, rCurb - sina * rCurb, dz));
            }
            this.wires = [wireHorizontal0, wireHorizontal1, curbLeft0, curbLeft1, wireVertical0, wireVertical1, curbRight0, curbRight1];
            this.generateWires();
            this._animatePivot = Mummu.AnimationFactory.CreateNumber(this, this.pivot.rotation, "z", () => {
                if (!this.machine.playing) {
                    this.pivot.rotation.z = (this.mirrorZ ? -1 : 1) * Math.PI / 4;
                }
                this.pivot.freezeWorldMatrix();
                this.pivot.getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
                this.wires.forEach((wire) => {
                    wire.recomputeAbsolutePath();
                });
            }, false, Nabu.Easing.easeInSquare);
            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }
        static PropToPartName(prop) {
            let partName = "forwardSplit";
            return partName;
        }
        async instantiateMachineSpecific() {
            let anchorDatas = [];
            let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.001, diameter: 0.01 });
            let q = BABYLON.Quaternion.Identity();
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, 0.015));
            anchorDatas.push(tmpVertexData);
            this.axisZMin = -this.wireGauge * 0.6 - 0.004;
            this.axisZMax = 0.015 - 0.001 * 0.5;
            tmpVertexData = BABYLON.CreateCylinderVertexData({ height: this.axisZMax - this.axisZMin, diameter: 0.001 });
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, (this.axisZMax + this.axisZMin) * 0.5));
            anchorDatas.push(tmpVertexData);
            this.anchor.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
            Mummu.MergeVertexDatas(...anchorDatas).applyToMesh(this.anchor);
            let arrowData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon", 0);
            if (arrowData) {
                arrowData = Mummu.CloneVertexData(arrowData);
                Mummu.TranslateVertexDataInPlace(arrowData, new BABYLON.Vector3(0, 0, this.axisZMin));
                arrowData.applyToMesh(this.pivot);
            }
            this.pivot.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
        }
        static GenerateTemplate(mirrorZ) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "forwardSplit";
            template.l = 1;
            template.h = 1;
            template.d = 3;
            template.mirrorZ = mirrorZ;
            template.zMirrorable = true;
            template.maxAngle = Math.PI / 16;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let pEndLeft = new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5, -MarbleRunSimulatorCore.tileDepth);
            pEndLeft.x -= MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2;
            pEndLeft.y += MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2;
            let pEndRight = new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            pEndRight.x += MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2;
            pEndRight.y += MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2;
            let dirEnd = MarbleRunSimulatorCore.Tools.V3Dir(135);
            let nEnd = MarbleRunSimulatorCore.Tools.V3Dir(45);
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, -MarbleRunSimulatorCore.tileDepth), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], pEndLeft.subtract(dirEnd.scale(0.001)), dirEnd)
            ];
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].preferedStartBank = 0;
            template.trackTemplates[1].preferedEndBank = 0;
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5 - MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2 - 0.001, -MarbleRunSimulatorCore.tileDepth + MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2), Mummu.RotateInPlace(MarbleRunSimulatorCore.Tools.V3Dir(135), BABYLON.Axis.Y, -Math.PI * 0.5), BABYLON.Vector3.Up()),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * template.h + 0.001, -0.5 * MarbleRunSimulatorCore.tileWidth), new BABYLON.Vector3(0, 0, 1), BABYLON.Vector3.Up()),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0), dir)
            ];
            template.trackTemplates[2] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[2].preferedStartBank = 0;
            template.trackTemplates[2].colorIndex = 2;
            template.trackTemplates[2].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5 - MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2 - 0.001, -MarbleRunSimulatorCore.tileDepth - MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2), Mummu.RotateInPlace(MarbleRunSimulatorCore.Tools.V3Dir(135), BABYLON.Axis.Y, Math.PI * 0.5), BABYLON.Vector3.Up()),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * template.h + 0.001, -2 * MarbleRunSimulatorCore.tileDepth + 0.5 * MarbleRunSimulatorCore.tileWidth), new BABYLON.Vector3(0, 0, -1), BABYLON.Vector3.Up()),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, -2 * MarbleRunSimulatorCore.tileDepth), dir)
            ];
            template.trackTemplates[3] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[3].preferedStartBank = 0;
            template.trackTemplates[3].colorIndex = 3;
            template.trackTemplates[3].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5 + 0.01, 0.016, -MarbleRunSimulatorCore.tileDepth), dir, BABYLON.Vector3.Down()),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], pEndLeft.add(new BABYLON.Vector3(0.019, 0, 0)), BABYLON.Vector3.Down(), BABYLON.Vector3.Left()),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], pEndLeft.add(new BABYLON.Vector3(0.019, -0.008, 0)), BABYLON.Vector3.Down(), BABYLON.Vector3.Left())
            ];
            template.trackTemplates[3].drawStartTip = true;
            template.trackTemplates[3].drawEndTip = true;
            template.trackTemplates[3].cutOutSleeper = (n) => {
                return n > 12;
            };
            template.initialize();
            return template;
        }
        dispose() {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }
        update(dt) {
            super.update(dt);
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivot.absolutePosition) < 0.05) {
                        let local = BABYLON.Vector3.TransformCoordinates(ball.position, this.pivot.getWorldMatrix().clone().invert());
                        if (local.y < ball.radius * 0.9) {
                            if (this._exitLeft && local.x > ball.radius * 0.5 && local.x < MarbleRunSimulatorCore.Split.pivotL) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(-Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                        this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                                        this.clicSound.play();
                                        this._moving = false;
                                        this._exitLeft = false;
                                    });
                                }, 150 / this.game.currentTimeFactor);
                                return;
                            }
                            else if (!this._exitLeft && local.x > -MarbleRunSimulatorCore.Split.pivotL && local.x < -ball.radius * 0.5) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                        this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                                        this.clicSound.play();
                                        this._moving = false;
                                        this._exitLeft = true;
                                    });
                                }, 150 / this.game.currentTimeFactor);
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    ForwardSplit.pivotL = 0.013;
    MarbleRunSimulatorCore.ForwardSplit = ForwardSplit;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class GravityWell extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.wellPath = [];
            this.setTemplate(this.machine.templateManager.getTemplate(GravityWell.PropToPartName(prop), prop.mirrorX));
            this.wellPath = [new BABYLON.Vector3(0.012, 0, 0), new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 1.2, MarbleRunSimulatorCore.tileHeight * 0.9, 0)];
            Mummu.CatmullRomPathInPlace(this.wellPath, MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(0));
            Mummu.CatmullRomPathInPlace(this.wellPath, MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(0));
            Mummu.CatmullRomPathInPlace(this.wellPath, MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(0));
            Mummu.CatmullRomPathInPlace(this.wellPath, MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(0));
            this.wellPath.splice(0, 0, new BABYLON.Vector3(0.01, -0.01, 0));
            this.wellPath.push(new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 1.2, MarbleRunSimulatorCore.tileHeight * 1, 0));
            this.wellMesh = new BABYLON.Mesh("gravitywell-mesh");
            this.wellMesh.position.copyFromFloats(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * 1.6, -MarbleRunSimulatorCore.tileDepth);
            this.wellMesh.parent = this;
            this.circleTop = new BABYLON.Mesh("wire-top");
            this.circleTop.position.copyFromFloats(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * 0.6, -MarbleRunSimulatorCore.tileDepth);
            this.circleTop.parent = this;
            this.circleBottom = new BABYLON.Mesh("wire-top");
            this.circleBottom.position.copyFromFloats(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * 1.6 - 0.01, -MarbleRunSimulatorCore.tileDepth);
            this.circleBottom.parent = this;
            this.generateWires();
        }
        static PropToPartName(prop) {
            return "gravitywell";
        }
        async instantiateMachineSpecific() {
            if (this.wellMesh) {
                this.wellMesh.dispose();
            }
            this.wellMesh = BABYLON.MeshBuilder.CreateLathe("gravitywell-mesh", { shape: this.wellPath, tessellation: 32, sideOrientation: BABYLON.Mesh.DOUBLESIDE });
            this.wellMesh.position.copyFromFloats(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * 1.6, -MarbleRunSimulatorCore.tileDepth);
            this.wellMesh.parent = this;
            this.wellMesh.material = this.machine.game.materials.getMaterial(0, this.machine.materialQ);
            BABYLON.CreateTorusVertexData({ diameter: MarbleRunSimulatorCore.tileWidth * 2 * 1.2, thickness: this.wireSize, tessellation: 32 }).applyToMesh(this.circleTop);
            this.circleTop.material = this.wellMesh.material;
            BABYLON.CreateTorusVertexData({ diameter: 0.01 * 2, thickness: this.wireSize, tessellation: 32 }).applyToMesh(this.circleBottom);
            this.circleBottom.material = this.wellMesh.material;
        }
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.l = 2;
            template.h = 3;
            template.d = 3;
            template.partName = "gravitywell";
            template.mirrorX = mirrorX;
            template.xMirrorable = true;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.2 + MarbleRunSimulatorCore.tileWidth * 0.5, -0.01, 0), MarbleRunSimulatorCore.Tools.V3Dir(120))];
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.2 + MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h + 0.025, -MarbleRunSimulatorCore.tileDepth), MarbleRunSimulatorCore.Tools.V3Dir(150)), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 1.5, -MarbleRunSimulatorCore.tileHeight * template.h, -MarbleRunSimulatorCore.tileDepth), MarbleRunSimulatorCore.Tools.V3Dir(90))];
            template.trackTemplates[1].drawStartTip = true;
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
            let wellPath = [new BABYLON.Vector3(0.012, 0, 0), new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 1.2, MarbleRunSimulatorCore.tileHeight * 0.9, 0)];
            Mummu.CatmullRomPathInPlace(wellPath, MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(0));
            Mummu.CatmullRomPathInPlace(wellPath, MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(0));
            wellPath.splice(0, 0, new BABYLON.Vector3(0.01, -0.01, 0));
            for (let i = 0; i < wellPath.length; i++) {
                let c = new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * 1.6, -MarbleRunSimulatorCore.tileDepth);
                c.y += wellPath[i].y;
                let r = wellPath[i].x;
                template.miniatureShapes.push(MarbleRunSimulatorCore.MiniatureShape.MakeNGon(c, r, BABYLON.Axis.Y, 24, false));
            }
            return template;
        }
    }
    MarbleRunSimulatorCore.GravityWell = GravityWell;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Join extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.setTemplate(this.machine.templateManager.getTemplate(Join.PropToPartName(prop)));
            for (let i = this.colors.length; i < 3; i++) {
                this.colors[i] = 0;
            }
            this.generateWires();
        }
        static PropToPartName(prop) {
            return "join";
        }
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "join";
            template.mirrorX = mirrorX;
            template.xMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let dirJoin = MarbleRunSimulatorCore.Tools.V3Dir(-120);
            let nJoin = MarbleRunSimulatorCore.Tools.V3Dir(-30);
            let pEnd = new BABYLON.Vector3(0.01, -MarbleRunSimulatorCore.tileHeight * 0.3, 0);
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.2, -MarbleRunSimulatorCore.tileHeight, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight, 0), dir),
            ];
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir.scale(-1)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], pEnd, dirJoin)
            ];
            template.trackTemplates[2] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 2;
            template.trackTemplates[2].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.25, 0.008, 0), MarbleRunSimulatorCore.Tools.V3Dir(135), BABYLON.Vector3.Down()),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.25, 0.008, 0), MarbleRunSimulatorCore.Tools.V3Dir(50), BABYLON.Vector3.Down()),
            ];
            template.trackTemplates[2].drawStartTip = true;
            template.trackTemplates[2].drawEndTip = true;
            template.trackTemplates[2].noMiniatureRender = true;
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.Join = Join;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Jumper extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.setTemplate(this.machine.templateManager.getTemplate(Jumper.PropToPartName(prop)));
            this.generateWires();
        }
        static PropToPartName(prop) {
            let partName = "jumper_" + prop.n.toFixed(0);
            return partName;
        }
        static GenerateTemplate(n) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "jumper_" + n.toFixed(0);
            template.l = 2;
            template.h = 2;
            template.n = n;
            template.nExtendable = true;
            if (n < 9) {
                let d = 2.5 * MarbleRunSimulatorCore.tileHeight;
                let aDeg = template.n * 10;
                let aRad = (aDeg / 180) * Math.PI;
                let xEnd = MarbleRunSimulatorCore.tileWidth * 0.5 + Math.cos(aRad) * d;
                let yEnd = -MarbleRunSimulatorCore.tileHeight * template.h + Math.sin(aRad) * d;
                template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
                template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xEnd, yEnd, 0), MarbleRunSimulatorCore.Tools.V3Dir(90 - aDeg))];
            }
            else {
                let d = 2.5 * MarbleRunSimulatorCore.tileHeight - 0.02;
                template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
                template.trackTemplates[0].trackpoints = [
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5 + 0.02, -MarbleRunSimulatorCore.tileHeight * template.h, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5 + 0.02 + d * Math.SQRT2 / 2, MarbleRunSimulatorCore.tileHeight * 0.5 - 0.02 - d * Math.SQRT2 / 2, 0)),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, MarbleRunSimulatorCore.tileHeight * 0.5 - 0.01, 0), MarbleRunSimulatorCore.Tools.V3Dir(0)),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, MarbleRunSimulatorCore.tileHeight * 0.5, 0), MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(-90))
                ];
            }
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.Jumper = Jumper;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
/// <reference path="../machine/MachinePart.ts"/>
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class LargeLoop extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            if (!isFinite(prop.n)) {
                prop.n = 1;
            }
            prop.n = Math.min(prop.n, 2 * Math.abs(prop.d));
            this.setTemplate(this.machine.templateManager.getTemplate(LargeLoop.PropToPartName(prop)));
            this.generateWires();
        }
        static PropToPartName(prop) {
            let partName = "largeLoop_" + prop.l.toFixed(0) + "." + prop.d.toFixed(0) + "." + prop.n.toFixed(0);
            return partName;
        }
        static GenerateTemplate(l, d, n) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "largeLoop_" + l.toFixed(0) + "." + d.toFixed(0) + "." + n.toFixed(0);
            template.l = l;
            template.d = d;
            template.n = n;
            template.lExtendableOnX = true;
            template.minL = 3;
            template.dExtendableOnZ = true;
            template.minD = -32;
            template.maxD = 32;
            template.minDAbsolute = 1;
            template.nExtendable = true;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].onNormalEvaluated = (n) => {
                n.z = 0;
                n.normalize();
            };
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileSize * 0.5, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90))];
            let loopsCount = n;
            let xCenter = -MarbleRunSimulatorCore.tileSize * 0.5 + MarbleRunSimulatorCore.tileSize * template.l * 0.5;
            let r = MarbleRunSimulatorCore.tileSize * template.l * 0.5 * 0.7;
            let depthStart = 0;
            let depthEnd = MarbleRunSimulatorCore.tileSize * template.d;
            for (let nLoop = 0; nLoop < loopsCount; nLoop++) {
                for (let n = 0; n <= 8; n++) {
                    if (n < 8 || nLoop === loopsCount - 1) {
                        let f = (n + 8 * nLoop) / (8 * loopsCount);
                        let a = (2 * Math.PI * n) / 8;
                        let cosa = Math.cos(a);
                        let sina = Math.sin(a);
                        let fx = 0.5;
                        if (loopsCount > 1) {
                            fx = nLoop / (loopsCount - 1);
                        }
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(sina * r + xCenter, r * 1 - cosa * r, f * (depthEnd - depthStart) + depthStart)));
                    }
                }
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileSize * template.l - MarbleRunSimulatorCore.tileSize * 0.5, 0, depthEnd), MarbleRunSimulatorCore.Tools.V3Dir(90)));
            let points = template.trackTemplates[0].trackpoints.map((tp) => {
                return tp.position.clone();
            });
            let f = 3;
            for (let n = 0; n < 2; n++) {
                let smoothedPoints = [...points].map((p) => {
                    return p.clone();
                });
                for (let i = 1; i < smoothedPoints.length - 1; i++) {
                    smoothedPoints[i]
                        .copyFrom(points[i - 1])
                        .addInPlace(points[i].scale(f))
                        .addInPlace(points[i + 1])
                        .scaleInPlace(1 / (2 + f));
                }
                points = smoothedPoints;
            }
            for (let i = 0; i < points.length; i++) {
                template.trackTemplates[0].trackpoints[i].position.copyFrom(points[i]);
            }
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.LargeLoop = LargeLoop;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
/// <reference path="../machine/MachinePart.ts"/>
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Loop extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            if (!isFinite(prop.n)) {
                prop.n = 1;
            }
            prop.n = Math.min(prop.n, 2 * Math.abs(prop.d));
            this.setTemplate(this.machine.templateManager.getTemplate(Loop.PropToPartName(prop)));
            this.generateWires();
        }
        static PropToPartName(prop) {
            let partName = "loop_" + prop.l.toFixed(0) + "." + prop.d.toFixed(0) + "." + prop.n.toFixed(0);
            return partName;
        }
        static GenerateTemplate(l, d, n) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "loop_" + l.toFixed(0) + "." + d.toFixed(0) + "." + n.toFixed(0);
            template.l = l;
            template.d = d;
            template.n = n;
            template.lExtendableOnX = true;
            template.minL = 3;
            template.dExtendableOnZ = true;
            template.minD = -32;
            template.maxD = 32;
            template.minDAbsolute = 1;
            template.nExtendable = true;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].onNormalEvaluated = (n) => {
                n.z = 0;
                n.normalize();
            };
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileSize * 0.5, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90))];
            let loopsCount = n;
            let xStart = -MarbleRunSimulatorCore.tileSize * 0.5;
            let xEnd = -MarbleRunSimulatorCore.tileSize * 0.5 + MarbleRunSimulatorCore.tileSize * template.l;
            let r = MarbleRunSimulatorCore.tileWidth * 0.7;
            let depthStart = 0;
            let depthEnd = MarbleRunSimulatorCore.tileSize * template.d;
            for (let nLoop = 0; nLoop < loopsCount; nLoop++) {
                for (let n = 0; n <= 8; n++) {
                    if (n < 8 || xStart != xEnd || nLoop === loopsCount - 1) {
                        let f = (n + 8 * nLoop) / (8 * loopsCount);
                        let a = (2 * Math.PI * n) / 8;
                        let cosa = Math.cos(a);
                        let sina = Math.sin(a);
                        let fx = 0.5;
                        if (loopsCount > 1) {
                            fx = nLoop / (loopsCount - 1);
                        }
                        let x = (1 - fx) * xStart + fx * xEnd;
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(sina * r + x, r * 1 - cosa * r, f * (depthEnd - depthStart) + depthStart)));
                    }
                }
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileSize * template.l - MarbleRunSimulatorCore.tileSize * 0.5, 0, depthEnd), MarbleRunSimulatorCore.Tools.V3Dir(90)));
            let points = template.trackTemplates[0].trackpoints.map((tp) => {
                return tp.position.clone();
            });
            let f = 3;
            for (let n = 0; n < 2; n++) {
                let smoothedPoints = [...points].map((p) => {
                    return p.clone();
                });
                for (let i = 1; i < smoothedPoints.length - 1; i++) {
                    smoothedPoints[i]
                        .copyFrom(points[i - 1])
                        .addInPlace(points[i].scale(f))
                        .addInPlace(points[i + 1])
                        .scaleInPlace(1 / (2 + f));
                }
                points = smoothedPoints;
            }
            for (let i = 0; i < points.length; i++) {
                template.trackTemplates[0].trackpoints[i].position.copyFrom(points[i]);
            }
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.Loop = Loop;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
/// <reference path="../machine/MachinePart.ts"/>
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class MultiJoin extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.setTemplate(this.machine.templateManager.getTemplate(MultiJoin.PropToPartName(prop)));
            this.generateWires();
        }
        static PropToPartName(prop) {
            return "multiJoin_" + prop.l.toFixed(0);
        }
        static GenerateTemplate(l, mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "multiJoin_" + l.toFixed(0);
            template.l = l;
            template.lExtendableOnX = true;
            template.mirrorX = mirrorX;
            let xLeft = -MarbleRunSimulatorCore.tileSize * 1.5;
            let xRight = MarbleRunSimulatorCore.tileSize * l + 0.01;
            let trackLength = xRight - xLeft;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xLeft, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90))
            ];
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xRight, 0.7 * MarbleRunSimulatorCore.tileHeight, 0), MarbleRunSimulatorCore.Tools.V3Dir(90 - Math.atan(MarbleRunSimulatorCore.tileHeight / (trackLength / 2)) / Math.PI * 180)));
            template.trackTemplates[0].drawEndTip = true;
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(xLeft, 0 + 0.01, -0.01), MarbleRunSimulatorCore.Tools.V3Dir(90), new BABYLON.Vector3(0, 0, 1))
            ];
            template.trackTemplates[1].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(xRight, 0.7 * MarbleRunSimulatorCore.tileHeight + 0.01, -0.01), MarbleRunSimulatorCore.Tools.V3Dir(90 - Math.atan(MarbleRunSimulatorCore.tileHeight / (trackLength / 2)) / Math.PI * 180), new BABYLON.Vector3(0, 0, 1)));
            template.trackTemplates[1].drawStartTip = true;
            template.trackTemplates[1].drawEndTip = true;
            template.trackTemplates[1].forcedAngle = 0;
            template.trackTemplates[1].onNormalEvaluated = (n) => {
                n.copyFromFloats(0, 0, 1);
            };
            template.trackTemplates[1].noMiniatureRender = true;
            let p0 = template.trackTemplates[0].trackpoints[0].position;
            let p1 = template.trackTemplates[0].trackpoints[1].position;
            let dist = BABYLON.Vector3.Distance(p0, p1);
            let t0 = template.trackTemplates[0].trackpoints[0].dir.scale(dist);
            let t1 = template.trackTemplates[0].trackpoints[1].dir.scale(dist);
            for (let i = 0; i < l; i++) {
                template.trackTemplates[2 + i] = new MarbleRunSimulatorCore.TrackTemplate(template);
                let x = MarbleRunSimulatorCore.tileSize + i * MarbleRunSimulatorCore.tileSize;
                let z = MarbleRunSimulatorCore.tileSize * 2.5;
                let f = (x - xLeft) / (trackLength);
                let pos = BABYLON.Vector3.Hermite(p0, t0, p1, t1, f);
                let tmpPoint = new BABYLON.Vector3(x, MarbleRunSimulatorCore.tileHeight, z * 0.3 + 0.009 * 0.7);
                let exitPoint = new BABYLON.Vector3(x, pos.y + 0.004, 0.009);
                template.trackTemplates[2 + i].trackpoints = [
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2 + i], new BABYLON.Vector3(x, MarbleRunSimulatorCore.tileHeight, z), new BABYLON.Vector3(0, 0, -1)),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2 + i], exitPoint, exitPoint.subtract(tmpPoint).normalize())
                ];
            }
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.MultiJoin = MultiJoin;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Ramp extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.setTemplate(this.machine.templateManager.getTemplate(Ramp.PropToPartName(prop)));
            this.generateWires();
        }
        static PropToPartName(prop) {
            let partName = (prop.pipeVersion ? "pipe" : "") + (prop.woodVersion ? "wood" : "") + "ramp_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
            if (!prop.pipeVersion && !prop.woodVersion) {
                partName += "." + prop.s.toFixed(0);
            }
            return partName;
        }
        static GenerateTemplate(l, h, d, s, pipeVersion, woodVersion) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = (pipeVersion ? "pipe" : "") + (woodVersion ? "wood" : "") + "ramp_" + l.toFixed(0) + "." + h.toFixed(0) + "." + d.toFixed(0);
            if (!pipeVersion && !woodVersion) {
                template.partName += "." + s.toFixed(0);
            }
            template.l = l;
            template.h = h;
            template.d = d;
            template.lExtendableOnX = true;
            template.hExtendableOnY = true;
            template.dExtendableOnZ = true;
            template.minH = -32;
            template.maxH = 32;
            template.minD = -32;
            template.maxD = 32;
            if (!pipeVersion) {
                template.sExtendable = true;
            }
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].isPipe = pipeVersion;
            template.trackTemplates[0].isWood = woodVersion;
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileSize * 0.5, 0, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileSize * template.l - MarbleRunSimulatorCore.tileSize * 0.5, MarbleRunSimulatorCore.tileSize * template.h, MarbleRunSimulatorCore.tileSize * template.d), dir)
            ];
            template.maxAngle = Math.PI / 4 / 2 * template.s;
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.Ramp = Ramp;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
/*
namespace MarbleRunSimulatorCore {
    
    export class RampV2 extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            
            this.setTemplate(this.machine.templateManager.getTemplate(RampV2.PropToPartName(prop)));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return (prop.pipeVersion ? "pipe" : "") + (prop.woodVersion ? "wood" : "") + "rampv2_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
        }

        public static GenerateTemplate(l: number, h: number, d: number, pipeVersion?: boolean, woodVersion?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = (pipeVersion ? "pipe" : "") + (woodVersion ? "wood" : "") + "rampv2_" + l.toFixed(0) + "." + h.toFixed(0) + "." + d.toFixed(0);

            template.l = l;
            template.h = h;
            template.d = d;
            template.lExtendableOnX = true;
            template.hExtendableOnY = true;
            template.dExtendableOnZ = true;
            template.minH = -32;
            template.maxH = 32;
            template.minD = -32;
            template.maxD = 32;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].isPipe = pipeVersion;
            template.trackTemplates[0].isWood = woodVersion;

            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- tileSize * 0.5, 0, 0), dir),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileSize * template.l - tileSize * 0.5, tileSize * template.h, tileSize * template.d), dir)
            ];

            template.maxAngle = Math.PI / 4 / 2 * template.s;

            template.initialize();

            return template;
        }
    }
}
*/ 
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Screen extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this._animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;
            this._animateLock0 = Mummu.AnimationFactory.EmptyNumberCallback;
            this._animateLock2 = Mummu.AnimationFactory.EmptyNumberCallback;
            this._animateTingle2Out = Mummu.AnimationFactory.EmptyNumberCallback;
            this.pixels = [];
            this.pixelPictures = [];
            this.value = 0;
            this.engraine12Up = false;
            this.engraine12Down = false;
            this.reset = () => {
                this.value = 0;
                let rz1s = [2 * Math.PI, 2 * Math.PI, 0, 0];
                let lock0Target = 0;
                let lock2Target = 0;
                if (this.value & 0b1) {
                    rz1s[0] = Math.PI;
                    lock0Target = -Math.PI * 0.5;
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
            };
            this._moving = false;
            this._lastCamRotZ = 0;
            this._visibleAngularSpeed = 0;
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
            ];
            this.lock0 = new BABYLON.Mesh("lock-0");
            this.lock0.position.copyFromFloats(0.0015, -0.009 * 1.25, 0.0115 * 1.25);
            this.lock0.parent = this.pixels[0];
            this.lock2 = new BABYLON.Mesh("lock-1");
            this.lock2.position.copyFromFloats(0.0015, -0.009 * 1.25, -0.0115 * 1.25);
            this.lock2.parent = this.pixels[2];
            this.pixels[0].parent = this.container;
            this.pixels[0].position.copyFromFloats(MarbleRunSimulatorCore.tileWidth * 0.5 - 0.02, 0, -MarbleRunSimulatorCore.tileDepth / 4);
            this.pixels[1].parent = this.container;
            this.pixels[1].position.copyFromFloats(MarbleRunSimulatorCore.tileWidth * 0.5 - 0.02, 0, MarbleRunSimulatorCore.tileDepth / 4);
            this.pixels[2].parent = this.container;
            this.pixels[2].position.copyFromFloats(MarbleRunSimulatorCore.tileWidth * 0.5 - 0.02, -MarbleRunSimulatorCore.tileHeight * 1.5, MarbleRunSimulatorCore.tileDepth / 4);
            this.pixels[3].parent = this.container;
            this.pixels[3].position.copyFromFloats(MarbleRunSimulatorCore.tileWidth * 0.5 - 0.02, -MarbleRunSimulatorCore.tileHeight * 1.5, -MarbleRunSimulatorCore.tileDepth / 4);
            for (let i = 0; i < 4; i++) {
                this.pixelPictures[i] = BABYLON.MeshBuilder.CreatePlane("pixel-pic", { width: 0.025, height: 0.026 });
                this.pixelPictures[i].rotation.y = Math.PI;
                this.pixelPictures[i].parent = this.pixels[i];
            }
            this.pixelPictures[0].position.z = 0.0005;
            this.pixelPictures[1].position.z = -0.0005;
            this.pixelPictures[2].position.z = -0.0005;
            this.pixelPictures[3].position.z = 0.0005;
            this.came = new BABYLON.Mesh("came");
            this.came.parent = this.container;
            this.came.position.copyFromFloats(-MarbleRunSimulatorCore.tileWidth * 0.5 + 0.014, -MarbleRunSimulatorCore.tileHeight * 0.25, 0);
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
            this._animatePivot = Mummu.AnimationFactory.CreateNumber(this, this.came.rotation, "z", () => {
                this.came.freezeWorldMatrix();
                this.came.getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
            }, false, Nabu.Easing.easePendulum);
            this._animateLock0 = Mummu.AnimationFactory.CreateNumber(this.lock0, this.lock0.rotation, "x", () => {
                this.lock0.freezeWorldMatrix();
            }, false, Nabu.Easing.easeInCubic);
            this._animateLock2 = Mummu.AnimationFactory.CreateNumber(this.lock2, this.lock2.rotation, "x", () => {
                this.lock2.freezeWorldMatrix();
            }, false, Nabu.Easing.easeInCubic);
            this._animateTingle2Out = Mummu.AnimationFactory.CreateNumber(this.pixels[2], this.pixels[2].rotation, "z", () => {
                this.pixels[2].freezeWorldMatrix();
                this.pixelPictures[2].freezeWorldMatrix();
                this.lock2.freezeWorldMatrix();
            }, false, Nabu.Easing.easeOutSine);
        }
        static PropToPartName(prop) {
            return "screen";
        }
        async tingle2(pixel2Value, duration) {
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
        rotatePixels(origin, target, duration, easing) {
            return new Promise(resolve => {
                let lock0Target = 0;
                let lock2Target = 0;
                let rz0s = [2 * Math.PI, 2 * Math.PI, 0, 0];
                let rz1s = [2 * Math.PI, 2 * Math.PI, 0, 0];
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
                    lock0Target = -Math.PI * 0.5;
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
                let tingle2Case = ((origin & 0b100) === (target & 0b100)) && ((origin & 0b10) === 0 && (target & 0b10) > 0);
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
                };
                this.game.scene.onBeforeRenderObservable.add(animationCB);
                this["rotatePixels_animation"] = animationCB;
            });
        }
        async instantiateMachineSpecific() {
            let screenData = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/screen.babylon");
            screenData[0].applyToMesh(this.came);
            this.came.material = this.game.materials.getMaterial(0, this.machine.materialQ);
            screenData[1].applyToMesh(this.cameInCollider);
            screenData[2].applyToMesh(this.cameOutCollider);
            for (let i = 0; i < 4; i++) {
                screenData[3 + i].applyToMesh(this.pixels[i]);
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
        static GenerateTemplate() {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "screen";
            template.h = 1;
            template.l = 1;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let dY = 0.014;
            let yIn = 0;
            let yOut = -MarbleRunSimulatorCore.tileHeight;
            let cY = (yIn + yOut + dY) * 0.5;
            let rIn = Math.abs(yIn - cY);
            let rOut = Math.abs(yOut - cY);
            let aMinOut = 0;
            let aMaxIn = Math.PI;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].cutOutSleeper = () => { return true; };
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, yIn, 0), MarbleRunSimulatorCore.Tools.V3Dir(90), MarbleRunSimulatorCore.Tools.V3Dir(0))];
            template.trackTemplates[0].noMiniatureRender = true;
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5 + dY + Math.sin(aMinOut) * rOut, cY + Math.cos(aMinOut) * rOut, 0), MarbleRunSimulatorCore.Tools.V3Dir(aMinOut / Math.PI * 180 + 90), MarbleRunSimulatorCore.Tools.V3Dir(aMinOut / Math.PI * 180 + 180))
            ];
            template.trackTemplates[1].drawStartTip = true;
            for (let a = 0; a <= 4; a++) {
                let f = a / 4;
                let angle = Math.PI * f;
                let cosa = Math.cos(angle);
                let sina = Math.sin(angle);
                let dir = MarbleRunSimulatorCore.Tools.V3Dir(angle / Math.PI * 180 + 90);
                let norm = MarbleRunSimulatorCore.Tools.V3Dir(angle / Math.PI * 180);
                if (angle < aMaxIn) {
                    let p = new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5 + dY, cY, 0);
                    p.x += sina * rIn;
                    p.y += cosa * rIn;
                    template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], p, dir, norm));
                }
                if (angle > aMinOut) {
                    let p = new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5 + dY, cY, 0);
                    p.x += sina * rOut;
                    p.y += cosa * rOut;
                    template.trackTemplates[1].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], p, dir, norm ? norm.scale(-1) : undefined));
                }
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5 + dY + Math.sin(aMaxIn) * rIn, cY + Math.cos(aMaxIn) * rIn, 0), MarbleRunSimulatorCore.Tools.V3Dir(aMaxIn / Math.PI * 180 + 90), MarbleRunSimulatorCore.Tools.V3Dir(aMaxIn / Math.PI * 180)));
            template.trackTemplates[1].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, yOut, 0), MarbleRunSimulatorCore.Tools.V3Dir(-90), MarbleRunSimulatorCore.Tools.V3Dir(0)));
            template.initialize();
            let shape = new MarbleRunSimulatorCore.MiniatureShape();
            shape.points = [
                new BABYLON.Vector3(MarbleRunSimulatorCore.tileSize * 0.5, MarbleRunSimulatorCore.tileSize * 0.6, -MarbleRunSimulatorCore.tileSize * 1.1),
                new BABYLON.Vector3(MarbleRunSimulatorCore.tileSize * 0.5, -MarbleRunSimulatorCore.tileSize * 1.6, -MarbleRunSimulatorCore.tileSize * 1.1),
                new BABYLON.Vector3(MarbleRunSimulatorCore.tileSize * 0.5, -MarbleRunSimulatorCore.tileSize * 1.6, MarbleRunSimulatorCore.tileSize * 1.1),
                new BABYLON.Vector3(MarbleRunSimulatorCore.tileSize * 0.5, MarbleRunSimulatorCore.tileSize * 0.6, MarbleRunSimulatorCore.tileSize * 1.1)
            ];
            template.miniatureShapes = [shape];
            return template;
        }
        isInside(ball) {
            let dY = 0.014;
            let yIn = 0;
            let yOut = -MarbleRunSimulatorCore.tileHeight;
            let cY = (yIn + yOut + dY) * 0.5;
            let center = new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5 + dY, cY, 0);
            BABYLON.Vector3.TransformCoordinatesToRef(center, this.getWorldMatrix(), center);
            let delta = ball.position.subtract(this.absolutePosition);
            if (Math.abs(BABYLON.Vector3.Dot(delta, this.forward)) < 0.03) {
                if (Math.abs(BABYLON.Vector3.Dot(delta, this.up)) < 0.03) {
                    let deltaX = BABYLON.Vector3.Dot(delta, this.right);
                    return deltaX < 0 && deltaX > -0.05;
                }
            }
        }
        get isMoving() {
            return this._moving;
        }
        update(dt) {
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
                                this._animatePivot(-2 * Math.PI, 2 / this.game.currentTimeFactor).then(() => {
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
    MarbleRunSimulatorCore.Screen = Screen;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Screw extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.x0 = 0;
            this.x1 = 0;
            this.stepW = 0;
            this.y0 = 0;
            this.y1 = 0;
            this.stepH = 0;
            this.dH = 0.002;
            this.reset = () => {
                this.a = 0;
                this.update(0);
            };
            this.length = 0;
            this.p = 0;
            this.speed = 2 * Math.PI; // in m/s
            this.a = 0;
            this.setTemplate(this.machine.templateManager.getTemplate(Screw.PropToPartName(prop)));
            let x = 1;
            this.x0 = -MarbleRunSimulatorCore.tileWidth * 0.3;
            this.x1 = MarbleRunSimulatorCore.tileWidth * 0.3 + (this.l - 3) * MarbleRunSimulatorCore.tileSize;
            this.y0 = -MarbleRunSimulatorCore.tileHeight * (this.h - 2 + 0.05) - 0.005;
            this.y1 = MarbleRunSimulatorCore.tileHeight * 0.05 + 0.005;
            for (let i = this.colors.length; i < 5; i++) {
                this.colors[i] = 0;
            }
            let r = 0.014;
            let period = 0.022;
            let p0 = new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0);
            p0.x += 0.03;
            p0.y -= 0.005;
            let p1 = new BABYLON.Vector3(MarbleRunSimulatorCore.tileSize * this.l - MarbleRunSimulatorCore.tileWidth * 0.5, MarbleRunSimulatorCore.tileHeight * this.h, -MarbleRunSimulatorCore.tileDepth * (this.d - 1));
            p1.x -= 0.03;
            p1.y += 0.005;
            this.dir = p1.subtract(p0);
            let l = this.dir.length();
            this.dir.scaleInPlace(1 / l);
            p0.subtractInPlace(this.dir.scale(0.007));
            p1.addInPlace(this.dir.scale(0.03));
            this.dir = p1.subtract(p0);
            l = this.dir.length();
            this.dir.scaleInPlace(1 / l);
            let n = Mummu.Rotate(this.dir, BABYLON.Axis.Z, Math.PI * 0.5);
            let shieldWireR = new MarbleRunSimulatorCore.Wire(this);
            shieldWireR.colorIndex = 3;
            shieldWireR.path = [p0.clone().addInPlaceFromFloats(0, 0, -0.012).addInPlace(this.dir.scale(0.04)).addInPlace(n.scale(0.01)), p0.clone().addInPlaceFromFloats(0, 0, -0.012).addInPlace(this.dir.scale(-0.02)).addInPlace(n.scale(0.01))];
            this.wires.push(shieldWireR);
            let shieldWireL = new MarbleRunSimulatorCore.Wire(this);
            shieldWireL.colorIndex = 3;
            shieldWireL.path = [p0.clone().addInPlaceFromFloats(0, 0, 0.012).addInPlace(this.dir.scale(0.04)).addInPlace(n.scale(0.01)), p0.clone().addInPlaceFromFloats(0, 0, 0.012).addInPlace(this.dir.scale(-0.02)).addInPlace(n.scale(0.01))];
            this.wires.push(shieldWireL);
            this.shieldConnector = new BABYLON.Mesh("shieldConnector");
            this.shieldConnector.position.copyFrom(p0).addInPlace(n.scale(0.01));
            this.shieldConnector.rotationQuaternion = Mummu.QuaternionFromYZAxis(n, this.dir);
            this.shieldConnector.parent = this;
            if (this.h / this.l > 1) {
                let shieldWireUpR = new MarbleRunSimulatorCore.Wire(this);
                shieldWireUpR.colorIndex = 3;
                shieldWireUpR.path = [p0.clone().addInPlaceFromFloats(0, 0, -0.0165).addInPlace(this.dir.scale(0.03)).addInPlace(n.scale(0.022)), p0.clone().addInPlaceFromFloats(0, 0, -0.0165).addInPlace(this.dir.scale(-0.033)).addInPlace(n.scale(0.022))];
                this.wires.push(shieldWireUpR);
                let shieldWireUpL = new MarbleRunSimulatorCore.Wire(this);
                shieldWireUpL.colorIndex = 3;
                shieldWireUpL.path = [p0.clone().addInPlaceFromFloats(0, 0, 0.0165).addInPlace(this.dir.scale(0.03)).addInPlace(n.scale(0.022)), p0.clone().addInPlaceFromFloats(0, 0, 0.0165).addInPlace(this.dir.scale(-0.03)).addInPlace(n.scale(0.022))];
                this.wires.push(shieldWireUpL);
                this.shieldConnectorUp = new BABYLON.Mesh("shieldConnectorUp");
                this.shieldConnectorUp.position.copyFrom(p0).addInPlace(this.dir.scale(-0.01)).addInPlace(n.scale(0.022));
                this.shieldConnectorUp.rotationQuaternion = Mummu.QuaternionFromYZAxis(n, this.dir);
                this.shieldConnectorUp.parent = this;
            }
            this.rotor = new BABYLON.Mesh("box");
            this.screwWire = new MarbleRunSimulatorCore.Wire(this);
            this.screwWire.colorIndex = 1;
            this.screwWire.wireSize = 0.003;
            this.screwWire.parent = this.rotor;
            this.screwWire.path = [];
            for (let t = 0; t <= l; t += 0.001) {
                let a = (t / period) * Math.PI * 2;
                let point = new BABYLON.Vector3(t, Math.cos(a) * r, Math.sin(a) * r);
                this.screwWire.path.push(point);
            }
            this.wires.push(this.screwWire);
            this.rotor.position.copyFrom(p0);
            this.rotor.position.addInPlace(n.scale(0.021));
            this.rotor.rotationQuaternion = Mummu.QuaternionFromXYAxis(this.dir, BABYLON.Axis.Y);
            this.rotor.parent = this;
            this.wheel = new BABYLON.Mesh("wheel");
            this.wheel.position.x = l;
            this.wheel.rotation.y = Math.PI * 0.5;
            this.wheel.parent = this.rotor;
            this.generateWires();
            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }
        static PropToPartName(prop) {
            let partName = "screw_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
            return partName;
        }
        async instantiateMachineSpecific() {
            let shieldData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/uConnector.babylon", 0);
            shieldData = Mummu.CloneVertexData(shieldData);
            Mummu.ScaleVertexDataInPlace(shieldData, 0.024);
            shieldData.applyToMesh(this.shieldConnector);
            this.shieldConnector.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
            if (this.shieldConnectorUp) {
                let shieldDataUp = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/uConnector.babylon", 0);
                shieldDataUp = Mummu.CloneVertexData(shieldDataUp);
                Mummu.ScaleVertexDataInPlace(shieldDataUp, 0.033);
                shieldDataUp.applyToMesh(this.shieldConnectorUp);
                this.shieldConnectorUp.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
            }
            let wheelData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/wheel.babylon", 1);
            wheelData = Mummu.CloneVertexData(wheelData);
            Mummu.ScaleVertexDataInPlace(wheelData, 1.05);
            wheelData.applyToMesh(this.wheel);
            this.wheel.material = this.game.materials.getMaterial(this.getColor(2), this.machine.materialQ);
        }
        static GenerateTemplate(l, h) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            if (isNaN(h)) {
                debugger;
            }
            template.partName = "screw_" + l.toFixed(0) + "." + h.toFixed(0);
            template.l = l;
            template.h = h;
            template.lExtendableOnX = true;
            template.minL = 3;
            template.hExtendableOnY = true;
            template.minH = 1;
            let p0 = new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0);
            p0.x += 0.03;
            p0.y -= 0.005;
            let p1 = new BABYLON.Vector3(MarbleRunSimulatorCore.tileSize * template.l - 0.5 * MarbleRunSimulatorCore.tileWidth, MarbleRunSimulatorCore.tileHeight * template.h, -MarbleRunSimulatorCore.tileDepth * (template.d - 1));
            p1.x -= 0.03;
            p1.y += 0.005;
            let dir = p1.subtract(p0).normalize();
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], p0, dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], p1, dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileSize * template.l - 0.5 * MarbleRunSimulatorCore.tileWidth, MarbleRunSimulatorCore.tileHeight * template.h, -MarbleRunSimulatorCore.tileDepth * (template.d - 1)), MarbleRunSimulatorCore.Tools.V3Dir(90)),
            ];
            template.maxAngle = Math.PI / 16;
            template.initialize();
            return template;
        }
        dispose() {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }
        update(dt) {
            super.update(dt);
            let dA = this.speed * dt * this.game.currentTimeFactor;
            let x = 1;
            this.a = this.a + dA;
            while (this.a > 2 * Math.PI) {
                this.a -= 2 * Math.PI;
            }
            if (this.a === 0) {
                Mummu.QuaternionFromXYAxisToRef(this.dir, BABYLON.Axis.Y, this.rotor.rotationQuaternion);
            }
            else {
                this.rotor.rotate(BABYLON.Axis.X, -dA);
            }
            this.rotor.freezeWorldMatrix();
            this.rotor.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
            this.screwWire.recomputeAbsolutePath();
        }
    }
    MarbleRunSimulatorCore.Screw = Screw;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Shooter extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.velocityKick = 1;
            this.kickerRadius = 0.0025;
            this.kickerLength = 0.04;
            this.kickerYIdle = 0;
            this.hasCollidingKicker = true;
            this.shieldYClosed = 0;
            this.shieldLength = 0.02;
            this.animateKickerArm = Mummu.AnimationFactory.EmptyNumberCallback;
            this.animateKickerKick = Mummu.AnimationFactory.EmptyNumberCallback;
            this.reset = () => {
                clearTimeout(this.delayTimeout);
                this.shieldClose = false;
                this.shield.position.y = this.shieldYClosed + this.shieldLength;
                this.shield.freezeWorldMatrix();
                this.shieldCollider.freezeWorldMatrix();
                this.currentShootState = 0;
                let x = 1;
                this.kicker.position.copyFromFloats(x * MarbleRunSimulatorCore.tileWidth * 0.4 - 0, this.kickerYIdle, 0);
                this._freezeKicker();
            };
            this.shieldClose = false;
            this.currentShootState = 0;
            this.shieldSpeed = 0.15;
            this.delayTimeout = 0;
            prop.h = Nabu.MinMax(prop.h, 3, 22);
            if (isNaN(prop.n)) {
                prop.n = 0;
            }
            this.setTemplate(this.machine.templateManager.getTemplate(Shooter.PropToPartName(prop)));
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
            this.kickerYIdle = MarbleRunSimulatorCore.tileHeight * 3 - dH - cupR * 0.8 - 0.004 + 0;
            this.kicker.parent = this;
            this.kicker.position.copyFromFloats(x * MarbleRunSimulatorCore.tileWidth * 0.4 - 0, this.kickerYIdle, 0);
            this.shield = new BABYLON.Mesh("shield");
            this.shieldCollider = new BABYLON.Mesh("collider-shield");
            this.shieldCollider.parent = this.shield;
            this.shieldCollider.isVisible = false;
            this.shieldYClosed = MarbleRunSimulatorCore.tileHeight * 3;
            this.shield.position.copyFromFloats(x * MarbleRunSimulatorCore.tileWidth * 0.4 - 0, this.shieldYClosed, 0);
            this.shield.parent = this;
            this.base.position.copyFromFloats(x * MarbleRunSimulatorCore.tileWidth * 0.4 - 0, this.shieldYClosed - 0.02, 0);
            this.base.parent = this;
            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
            this.animateKickerArm = Mummu.AnimationFactory.CreateNumber(this, this.kicker.position, "y", () => {
                this._freezeKicker();
            }, false, Nabu.Easing.easeOutCubic);
            this.animateKickerKick = Mummu.AnimationFactory.CreateNumber(this, this.kicker.position, "y", () => {
                this._freezeKicker();
            }, false, Nabu.Easing.easeOutElastic);
        }
        static PropToPartName(prop) {
            let partName = "shooter_" + prop.h.toFixed(0) + "." + prop.n.toFixed(0);
            return partName;
        }
        async instantiateMachineSpecific() {
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
        static GenerateTemplate(h, n) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
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
                template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
                template.trackTemplates[0].colorIndex = 0;
                template.trackTemplates[0].trackpoints = [
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, MarbleRunSimulatorCore.tileHeight * 3, 0), dir),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 - 1.6 * cupR, MarbleRunSimulatorCore.tileHeight * 3 - dH + 0, 0), dir),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 - 0, MarbleRunSimulatorCore.tileHeight * 3 - dH - cupR * 0.8 + 0, 0), dir),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 + cupR, MarbleRunSimulatorCore.tileHeight * 3 - dH + 0, 0), norm),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 + cupR, MarbleRunSimulatorCore.tileHeight * h + 0, 0), norm),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 + cupR - 0.015, 0.035 + MarbleRunSimulatorCore.tileHeight * h + 0, 0), new BABYLON.Vector3(-1, 1, 0).normalize(), new BABYLON.Vector3(-1, -1, 0).normalize()),
                ];
                template.trackTemplates[0].drawEndTip = true;
                template.trackTemplates[0].forcedAngle = 0;
                template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
                template.trackTemplates[1].colorIndex = 1;
                template.trackTemplates[1].trackpoints = [
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, MarbleRunSimulatorCore.tileHeight * h + 0, 0), dirLeft),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 + cupR - 0.02, MarbleRunSimulatorCore.tileHeight * 0.4 + MarbleRunSimulatorCore.tileHeight * h, 0), dirRight)
                ];
            }
            else {
                template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
                template.trackTemplates[0].trackpoints = [
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, MarbleRunSimulatorCore.tileHeight * 3, 0), dir),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 - 1.6 * cupR, MarbleRunSimulatorCore.tileHeight * 3 - dH + 0, 0), dir),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 - 0, MarbleRunSimulatorCore.tileHeight * 3 - dH - cupR * 0.8 + 0, 0), dir),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 + cupR, MarbleRunSimulatorCore.tileHeight * 3 - dH + 0, 0), norm),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 + cupR, MarbleRunSimulatorCore.tileHeight * 1.5 + MarbleRunSimulatorCore.tileHeight * h + 0, 0), norm),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 + cupR + 0.01, 0.025 + MarbleRunSimulatorCore.tileHeight * 1.5 + MarbleRunSimulatorCore.tileHeight * h + 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(45), MarbleRunSimulatorCore.Tools.V3Dir(-45)),
                ];
                template.trackTemplates[0].drawEndTip = true;
            }
            template.maxAngle = Math.PI / 16;
            template.initialize();
            template.miniatureShapes.push(MarbleRunSimulatorCore.MiniatureShape.MakeNGon(new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4, 0.06, 0), 0.025, BABYLON.Axis.Y, 16, true));
            template.miniatureShapes.push(MarbleRunSimulatorCore.MiniatureShape.MakeNGon(new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4, 0.04, 0), 0.015, BABYLON.Axis.Y, 16, true));
            template.miniatureShapes.push(MarbleRunSimulatorCore.MiniatureShape.MakeNGon(new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4, 0.035, 0), 0.015, BABYLON.Axis.Y, 16, true));
            return template;
        }
        dispose() {
            super.dispose();
            clearTimeout(this.delayTimeout);
            this.machine.onStopCallbacks.remove(this.reset);
        }
        get shieldOpened() {
            return this.shield.position.y >= this.shieldYClosed + this.shieldLength;
        }
        get shieldClosed() {
            return this.shield.position.y <= this.shieldYClosed;
        }
        getBallReady() {
            let center = new BABYLON.Vector3(this.kicker.position.x, MarbleRunSimulatorCore.tileHeight * 3, 0);
            BABYLON.Vector3.TransformCoordinatesToRef(center, this.getWorldMatrix(), center);
            for (let i = 0; i < this.machine.balls.length; i++) {
                let ball = this.machine.balls[i];
                if (Math.abs(ball.position.y - center.y) < MarbleRunSimulatorCore.tileHeight) {
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
        getBallArmed() {
            let center = new BABYLON.Vector3(this.kicker.position.x, MarbleRunSimulatorCore.tileHeight * 3, 0);
            BABYLON.Vector3.TransformCoordinatesToRef(center, this.getWorldMatrix(), center);
            for (let i = 0; i < this.machine.balls.length; i++) {
                let ball = this.machine.balls[i];
                if (ball.velocity.length() < 0.02) {
                    if (BABYLON.Vector3.DistanceSquared(center, ball.position) < 0.005 * 0.005) {
                        return ball;
                    }
                }
            }
        }
        update(dt) {
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
                this.animateKickerArm(this.kickerYIdle - this.kickerLength, 1.5 / this.game.currentTimeFactor).then(() => {
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
                        ballArmed.collisionState = MarbleRunSimulatorCore.CollisionState.Flyback;
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
                this.animateKickerKick(this.kickerYIdle, 0.8 / this.game.currentTimeFactor).then(() => {
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
        _freezeKicker() {
            this.kicker.freezeWorldMatrix();
            this.kicker.getChildMeshes().forEach(child => {
                child.freezeWorldMatrix();
            });
        }
    }
    Shooter.velocityKicks = [
        1,
        1,
        1,
        3,
        0.955,
        1.166,
        1.35,
        1.509,
        1.651,
        1.785,
        1.907,
        2.022,
        2.132,
        2.240,
        2.340,
        2.433,
        2.527,
        2.616,
        2.701,
        2.786,
        2.867,
        2.948,
        3.025,
    ];
    MarbleRunSimulatorCore.Shooter = Shooter;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Snake extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            prop.l = Math.max(prop.l, 2);
            this.setTemplate(this.machine.templateManager.getTemplate(Snake.PropToPartName(prop)));
            this.generateWires();
        }
        static PropToPartName(prop) {
            let partName = "snake_" + prop.l.toFixed(0) + "." + prop.s.toFixed(0);
            return partName;
        }
        static GenerateTemplate(w, s, mirrorX, mirrorZ) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "snake_" + w.toFixed(0) + "." + s.toFixed(0);
            template.angleSmoothSteps = 40;
            template.maxAngle = Math.PI / 8;
            template.l = w;
            template.h = 0;
            template.d = 3;
            template.s = s;
            template.mirrorX = mirrorX;
            template.mirrorZ = mirrorZ;
            template.xExtendable = true;
            template.sExtendable = true;
            template.xMirrorable = true;
            template.zMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let count = 3 * template.l;
            if (count % 2 === 1) {
                count--;
            }
            let l = MarbleRunSimulatorCore.tileWidth * template.l;
            let r = l / count;
            let r2 = r / Math.SQRT2 * 1.0;
            let r12 = r - r2;
            let z0 = -MarbleRunSimulatorCore.tileDepth * Math.floor(template.d / 2);
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            let start = new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, z0);
            let end = new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * (template.l - 0.5), 0, z0);
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], start, dir, undefined, undefined, 1)];
            for (let i = 1; i < count; i++) {
                let x = -MarbleRunSimulatorCore.tileWidth * 0.5 + i * r;
                if (i === 1) {
                    let z = z0 - r;
                    template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x - r12, 0, z + r2), new BABYLON.Vector3(1, 0, -1)));
                    template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, -1)));
                    template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z - r2), new BABYLON.Vector3(1, 0, -1)));
                }
                else if (i === count - 1) {
                    if (Math.floor(i / 2) % 2 === 0) {
                        let z = z0 + r;
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, -1)));
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z - r2), new BABYLON.Vector3(1, 0, -1)));
                    }
                    else {
                        let z = z0 - r;
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, 1)));
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z + r2), new BABYLON.Vector3(1, 0, 1)));
                    }
                }
                else if (i % 2 === 0) {
                    if (Math.floor(i / 2) % 2 === 0) {
                        let z = z0 + 2 * r;
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(1, 0, 0)));
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r2, 0, z - r12), new BABYLON.Vector3(1, 0, -1)));
                    }
                    else {
                        let z = z0 - 2 * r;
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(1, 0, 0)));
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r2, 0, z + r12), new BABYLON.Vector3(1, 0, 1)));
                    }
                }
                else {
                    if (Math.floor(i / 2) % 2 === 0) {
                        let z = z0 + r;
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, -1)));
                        z = z0 - r;
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, -1)));
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z - r2), new BABYLON.Vector3(1, 0, -1)));
                    }
                    else {
                        let z = z0 - r;
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, 1)));
                        z = z0 + r;
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, 1)));
                        template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z + r2), new BABYLON.Vector3(1, 0, 1)));
                    }
                }
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], end, dir, undefined, 1));
            template.maxAngle = Math.PI / 4 / 2 * template.s;
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            if (mirrorZ) {
                template.mirrorZTrackPointsInPlace();
            }
            template.initialize();
            return template;
        }
        recreateFromOriginDestination(origin, dest, machine) {
            let i = Math.min(origin.i, dest.i);
            let j = Math.min(origin.j, dest.j);
            let k = Math.min(origin.k, dest.k);
            let w = dest.i - origin.i;
            let h = Math.abs(dest.j - origin.j);
            let d = Math.abs(dest.k - origin.k) + 1;
            let mirrorX = dest.j < origin.j;
            let mirrorZ = false;
            if (mirrorX) {
                if (origin.k < dest.k) {
                    mirrorZ = true;
                }
            }
            else {
                if (origin.k > dest.k) {
                    mirrorZ = true;
                }
            }
            return new Snake(machine, {
                i: i,
                j: j,
                k: k,
                l: w,
                h: h,
                d: d,
                c: this.colors,
                mirrorX: mirrorX,
                mirrorZ: mirrorZ,
            });
        }
    }
    MarbleRunSimulatorCore.Snake = Snake;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Sort extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this._animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;
            this.axisZMin = 0;
            this.axisZMax = 1;
            this.reset = () => {
                this._moving = false;
                if (this.mirrorX) {
                    this.pivot.rotation.z = -(this.mirrorZ ? -1 : 1) * Math.PI / 4;
                }
                else {
                    this.pivot.rotation.z = (this.mirrorZ ? -1 : 1) * Math.PI / 4;
                }
                this.pivot.freezeWorldMatrix();
                this.pivot.getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
                this.wires.forEach((wire) => {
                    wire.recomputeAbsolutePath();
                });
            };
            this._moving = false;
            let partName = "sort";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.clicSound = new BABYLON.Sound("clic-sound", "./lib/marble-run-simulator-core/datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);
            for (let i = this.colors.length; i < 6; i++) {
                this.colors[i] = 0;
            }
            this.anchor = new BABYLON.Mesh("anchor");
            this.anchor.position.copyFromFloats(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            this.anchor.parent = this;
            this.pivot = new BABYLON.Mesh("pivot");
            this.pivot.position.copyFromFloats(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            this.pivot.parent = this;
            let dz = this.wireGauge * 0.5;
            this.panel = new BABYLON.Mesh("panel");
            this.panel.position = new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5 - 0.014, -MarbleRunSimulatorCore.tileHeight, this.wireGauge * 0.5);
            this.panel.parent = this;
            this.panelSupport = new BABYLON.Mesh("panel-support");
            this.panelSupport.parent = this.panel;
            this.panelPicture = new BABYLON.Mesh("panel-picture");
            this.panelPicture.parent = this.panel;
            let wireHorizontal0 = new MarbleRunSimulatorCore.Wire(this);
            wireHorizontal0.colorIndex = 4;
            wireHorizontal0.parent = this.pivot;
            wireHorizontal0.path = [new BABYLON.Vector3(-Sort.pivotL, 0, -dz), new BABYLON.Vector3(Sort.pivotL, 0, -dz)];
            let wireHorizontal1 = new MarbleRunSimulatorCore.Wire(this);
            wireHorizontal1.colorIndex = 4;
            wireHorizontal1.parent = this.pivot;
            wireHorizontal1.path = [new BABYLON.Vector3(-Sort.pivotL, 0, dz), new BABYLON.Vector3(Sort.pivotL, 0, dz)];
            let wireVertical0 = new MarbleRunSimulatorCore.Wire(this);
            wireVertical0.colorIndex = 4;
            wireVertical0.parent = this.pivot;
            wireVertical0.path = [new BABYLON.Vector3(0, Sort.pivotL, -dz), new BABYLON.Vector3(0, -Sort.pivotL, -dz)];
            let wireVertical1 = new MarbleRunSimulatorCore.Wire(this);
            wireVertical1.colorIndex = 4;
            wireVertical1.parent = this.pivot;
            wireVertical1.path = [new BABYLON.Vector3(0, Sort.pivotL, dz), new BABYLON.Vector3(0, -Sort.pivotL, dz)];
            this.wires = [wireHorizontal0, wireHorizontal1, wireVertical0, wireVertical1];
            this.generateWires();
            this._animatePivot = Mummu.AnimationFactory.CreateNumber(this, this.pivot.rotation, "z", () => {
                if (!this.machine.playing) {
                    this.pivot.rotation.z = (this.mirrorZ ? -1 : 1) * Math.PI / 4;
                }
                this.pivot.freezeWorldMatrix();
                this.pivot.getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
                this.wires.forEach((wire) => {
                    wire.recomputeAbsolutePath();
                });
            }, false, Nabu.Easing.easeInSquare);
            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }
        async instantiateMachineSpecific() {
            let anchorDatas = [];
            this.axisZMin = -this.wireGauge * 0.8;
            this.axisZMax = this.wireGauge * 0.8;
            let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.001, diameter: 0.004 });
            let q = BABYLON.Quaternion.Identity();
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, this.axisZMax));
            anchorDatas.push(tmpVertexData);
            tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.003, diameter: 0.003 });
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, this.wireGauge * 0.5));
            anchorDatas.push(tmpVertexData);
            tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.003, diameter: 0.003 });
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, -this.wireGauge * 0.5));
            anchorDatas.push(tmpVertexData);
            tmpVertexData = BABYLON.CreateCylinderVertexData({ height: this.axisZMax - this.axisZMin, diameter: 0.001 });
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, (this.axisZMax + this.axisZMin) * 0.5));
            anchorDatas.push(tmpVertexData);
            let arrowData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon", 0);
            if (arrowData) {
                arrowData = Mummu.CloneVertexData(arrowData);
                Mummu.QuaternionFromYZAxisToRef(MarbleRunSimulatorCore.Tools.V3Dir(-45), BABYLON.Axis.Z, q);
                Mummu.RotateVertexDataInPlace(arrowData, q);
                Mummu.TranslateVertexDataInPlace(arrowData, new BABYLON.Vector3(0, 0, this.axisZMin));
                anchorDatas.push(arrowData);
            }
            this.anchor.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
            Mummu.MergeVertexDatas(...anchorDatas).applyToMesh(this.anchor);
            let panelData = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/panel.babylon");
            panelData[0].applyToMesh(this.panel);
            this.panel.material = this.game.materials.getMaterial(this.getColor(6), this.machine.materialQ);
            panelData[1].applyToMesh(this.panelSupport);
            this.panelSupport.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
            panelData[2].applyToMesh(this.panelPicture);
            this.panelPicture.material = this.game.materials.getBallMaterial(this.game.materials.baseMaterialIndexToBallMaterialIndex(this.getColor(4)), this.machine.materialQ);
        }
        static GenerateTemplate(mirrorX, mirrorZ) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "sort";
            template.l = 1;
            template.h = 1;
            template.mirrorX = mirrorX;
            template.mirrorZ = mirrorZ;
            template.xMirrorable = true;
            template.zMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let pEndLeft = new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            pEndLeft.x -= Sort.pivotL / Math.SQRT2;
            pEndLeft.y += Sort.pivotL / Math.SQRT2;
            let pEndRight = new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            pEndRight.x += Sort.pivotL / Math.SQRT2;
            pEndRight.y += Sort.pivotL / Math.SQRT2;
            let dirEnd = MarbleRunSimulatorCore.Tools.V3Dir(125);
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], pEndLeft.subtract(dirEnd.scale(0.001)), dirEnd)
            ];
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(Sort.pivotL / Math.SQRT2, -MarbleRunSimulatorCore.tileHeight * 0.5 - Sort.pivotL / Math.SQRT2 - 0.001, 0), dirEnd),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0), dir)
            ];
            template.trackTemplates[2] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 2;
            template.trackTemplates[2].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(-Sort.pivotL / Math.SQRT2, -MarbleRunSimulatorCore.tileHeight * 0.5 - Sort.pivotL / Math.SQRT2 - 0.001, 0), dirEnd.multiplyByFloats(1, -1, 1))
            ];
            template.trackTemplates[3] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[3].colorIndex = 3;
            template.trackTemplates[3].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.25, 0.016, 0), MarbleRunSimulatorCore.Tools.V3Dir(100), new BABYLON.Vector3(0, -1, 0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], pEndRight.add(MarbleRunSimulatorCore.Tools.V3Dir(45, 0.003)), MarbleRunSimulatorCore.Tools.V3Dir(135), MarbleRunSimulatorCore.Tools.V3Dir(225)),
            ];
            template.trackTemplates[3].drawStartTip = true;
            template.trackTemplates[3].drawEndTip = true;
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
            return template;
        }
        dispose() {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }
        update(dt) {
            super.update(dt);
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivot.absolutePosition) < 0.05) {
                        let local = ball.position.subtract(this.position);
                        if (local.y < 0.08) {
                            let sortBallMaterialIndex = this.game.materials.baseMaterialIndexToBallMaterialIndex(this.getColor(4));
                            let exitLeft = true;
                            if (ball.materialIndex === sortBallMaterialIndex) {
                                exitLeft = false;
                            }
                            if (exitLeft && Math.abs(local.x) < 0.001) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(this.pivot.rotation.z + Math.PI / 2, 0.3 / this.game.currentTimeFactor).then(() => {
                                        this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                                        this.clicSound.play();
                                        this._moving = false;
                                    });
                                }, 150 / this.game.currentTimeFactor);
                                return;
                            }
                            else if (!exitLeft && Math.abs(local.x) < 0.001) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(this.pivot.rotation.z - Math.PI / 2, 0.3 / this.game.currentTimeFactor).then(() => {
                                        this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                                        this.clicSound.play();
                                        this._moving = false;
                                    });
                                }, 150 / this.game.currentTimeFactor);
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    Sort.pivotL = 0.013;
    MarbleRunSimulatorCore.Sort = Sort;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Spawner extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this._animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;
            this.axisZMin = 0;
            this.axisZMax = 1;
            this.reset = () => {
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
            this._moving = false;
            let partName = "spawner";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            this.clicSound = new BABYLON.Sound("clic-sound", "./lib/marble-run-simulator-core/datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);
            for (let i = this.colors.length; i < 6; i++) {
                this.colors[i] = 0;
            }
            this.axisZMin = -this.wireGauge * 0.6 - MarbleRunSimulatorCore.tileDepth;
            this.axisZMax = this.wireGauge * 0.6;
            if (this.mirrorX) {
                this.angleClosed = -Math.PI / 4;
            }
            else {
                this.angleClosed = Math.PI / 4;
            }
            this.angleOpened = -this.angleClosed;
            this.pivotPass = new BABYLON.Mesh("pivotPass");
            this.pivotPass.position.copyFromFloats(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            this.pivotPass.parent = this;
            let dz = this.wireGauge * 0.5;
            this.cog13 = new BABYLON.Mesh("cog13");
            this.cog13.parent = this.pivotPass;
            this.pivotSpawner = new BABYLON.Mesh("pivotSpawner");
            this.pivotSpawner.position.copyFromFloats(0, MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            this.pivotSpawner.parent = this;
            this.pivotSpawnerCollider = new BABYLON.Mesh("collider-trigger");
            this.pivotSpawnerCollider.isVisible = false;
            this.pivotSpawnerCollider.parent = this.pivotSpawner;
            this.cog8 = new BABYLON.Mesh("cog8");
            this.cog8.parent = this.pivotSpawner;
            this.support = new BABYLON.Mesh("support");
            this.support.position.copyFromFloats(0, -MarbleRunSimulatorCore.tileHeight * 0.5, -MarbleRunSimulatorCore.tileDepth * 0.5);
            this.support.parent = this;
            let wireHorizontal0 = new MarbleRunSimulatorCore.Wire(this);
            wireHorizontal0.colorIndex = 4;
            wireHorizontal0.parent = this.pivotPass;
            wireHorizontal0.path = [new BABYLON.Vector3(-Spawner.pivotL, 0, -dz - MarbleRunSimulatorCore.tileDepth), new BABYLON.Vector3(Spawner.pivotL, 0, -dz - MarbleRunSimulatorCore.tileDepth)];
            let wireHorizontal1 = new MarbleRunSimulatorCore.Wire(this);
            wireHorizontal1.colorIndex = 4;
            wireHorizontal1.parent = this.pivotPass;
            wireHorizontal1.path = [new BABYLON.Vector3(-Spawner.pivotL, 0, dz - MarbleRunSimulatorCore.tileDepth), new BABYLON.Vector3(Spawner.pivotL, 0, dz - MarbleRunSimulatorCore.tileDepth)];
            let wireVertical0 = new MarbleRunSimulatorCore.Wire(this);
            wireVertical0.colorIndex = 4;
            wireVertical0.parent = this.pivotPass;
            wireVertical0.path = [new BABYLON.Vector3(0, Spawner.pivotL, -dz - MarbleRunSimulatorCore.tileDepth), new BABYLON.Vector3(0, -Spawner.pivotL, -dz - MarbleRunSimulatorCore.tileDepth)];
            let wireVertical1 = new MarbleRunSimulatorCore.Wire(this);
            wireVertical1.colorIndex = 4;
            wireVertical1.parent = this.pivotPass;
            wireVertical1.path = [new BABYLON.Vector3(0, Spawner.pivotL, dz - MarbleRunSimulatorCore.tileDepth), new BABYLON.Vector3(0, -Spawner.pivotL, dz - MarbleRunSimulatorCore.tileDepth)];
            let arc0 = new MarbleRunSimulatorCore.Wire(this);
            arc0.wireSize = 0.001;
            arc0.colorIndex = 4;
            arc0.parent = this.pivotPass;
            arc0.path = [];
            let arc1 = new MarbleRunSimulatorCore.Wire(this);
            arc1.wireSize = 0.001;
            arc1.colorIndex = 4;
            arc1.parent = this.pivotPass;
            arc1.path = [];
            for (let i = 0; i <= 24; i++) {
                let a = i / 32 * 2 * Math.PI;
                if (this.mirrorX) {
                    a = -a;
                }
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                let r = Spawner.pivotL - 0.0005;
                let p0 = new BABYLON.Vector3(-sina * r, cosa * r, -dz - MarbleRunSimulatorCore.tileDepth);
                arc0.path.push(p0);
                let p1 = new BABYLON.Vector3(-sina * r, cosa * r, dz - MarbleRunSimulatorCore.tileDepth);
                arc1.path.push(p1);
            }
            this.wires = [wireHorizontal0, wireHorizontal1, wireVertical0, wireVertical1, arc0, arc1];
            this.generateWires();
            this._animatePivot = Mummu.AnimationFactory.CreateNumber(this, this.pivotPass.rotation, "z", () => {
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
            }, false, Nabu.Easing.easeInSquare);
            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }
        async instantiateMachineSpecific() {
            let q = Mummu.QuaternionFromYZAxis(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0));
            let axisPassVertexData = BABYLON.CreateCylinderVertexData({ height: MarbleRunSimulatorCore.tileDepth * 0.5 + this.wireGauge * 1.2, diameter: 0.001 });
            Mummu.RotateVertexDataInPlace(axisPassVertexData, q);
            Mummu.TranslateVertexDataInPlace(axisPassVertexData, new BABYLON.Vector3(0, 0, -0.25 * MarbleRunSimulatorCore.tileDepth));
            let axisSpawnerVertexData = BABYLON.CreateCylinderVertexData({ height: MarbleRunSimulatorCore.tileDepth * 0.5 + this.wireGauge * 1.2, diameter: 0.001 });
            Mummu.RotateVertexDataInPlace(axisSpawnerVertexData, q);
            Mummu.TranslateVertexDataInPlace(axisSpawnerVertexData, new BABYLON.Vector3(0, MarbleRunSimulatorCore.tileHeight, 0.25 * MarbleRunSimulatorCore.tileDepth));
            let supportData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 2);
            supportData = Mummu.MergeVertexDatas(axisSpawnerVertexData, axisPassVertexData, supportData);
            supportData.applyToMesh(this.support);
            this.support.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
            let cog8Data = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 0);
            cog8Data = Mummu.CloneVertexData(cog8Data);
            Mummu.TranslateVertexDataInPlace(cog8Data, new BABYLON.Vector3(0, 0, -MarbleRunSimulatorCore.tileDepth * 0.5));
            cog8Data.applyToMesh(this.cog8);
            this.cog8.material = this.game.materials.getMaterial(this.getColor(5), this.machine.materialQ);
            let cog13Data = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 1);
            cog13Data = Mummu.CloneVertexData(cog13Data);
            Mummu.TranslateVertexDataInPlace(cog13Data, new BABYLON.Vector3(0, 0, -MarbleRunSimulatorCore.tileDepth * 0.5));
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
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "spawner";
            template.l = 1;
            template.h = 1;
            template.d = 2;
            template.mirrorX = mirrorX;
            template.xMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let pEndLeft = new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            pEndLeft.x -= Spawner.pivotL / Math.SQRT2;
            pEndLeft.y += Spawner.pivotL / Math.SQRT2;
            let pEndRight = new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            pEndRight.x += Spawner.pivotL / Math.SQRT2;
            pEndRight.y += Spawner.pivotL / Math.SQRT2;
            let dirEnd = MarbleRunSimulatorCore.Tools.V3Dir(125);
            // Control
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0), dir, MarbleRunSimulatorCore.Tools.V3Dir(0), 2)
            ];
            // Pass
            // Pass In
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 2;
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, -MarbleRunSimulatorCore.tileDepth), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], pEndLeft.subtract(dirEnd.scale(0.001)).subtractFromFloats(0, 0, MarbleRunSimulatorCore.tileDepth), dirEnd)
            ];
            // Pass out Right
            template.trackTemplates[2] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 3;
            template.trackTemplates[2].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(MarbleRunSimulatorCore.Sort.pivotL / Math.SQRT2, -MarbleRunSimulatorCore.tileHeight * 0.5 - MarbleRunSimulatorCore.Sort.pivotL / Math.SQRT2 - 0.001, -MarbleRunSimulatorCore.tileDepth), dirEnd),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, -MarbleRunSimulatorCore.tileDepth), dir)
            ];
            // Shield
            template.trackTemplates[3] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[3].colorIndex = 4;
            template.trackTemplates[3].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.25, 0.016, -MarbleRunSimulatorCore.tileDepth), MarbleRunSimulatorCore.Tools.V3Dir(100), new BABYLON.Vector3(0, -1, 0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], pEndRight.add(MarbleRunSimulatorCore.Tools.V3Dir(45, 0.003)).subtractFromFloats(0, 0, MarbleRunSimulatorCore.tileDepth), MarbleRunSimulatorCore.Tools.V3Dir(135), MarbleRunSimulatorCore.Tools.V3Dir(225)),
            ];
            template.trackTemplates[3].drawStartTip = true;
            template.trackTemplates[3].drawEndTip = true;
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
            return template;
        }
        dispose() {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }
        update(dt) {
            super.update(dt);
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivotSpawner.absolutePosition) < 0.05) {
                        let local = BABYLON.Vector3.TransformCoordinates(ball.position, this.pivotSpawner.getWorldMatrix().clone().invert());
                        if (local.y < 0 && local.y > -0.03) {
                            if (local.x < 0 && local.x > -ball.radius - 0.004 ||
                                local.x > 0 && local.x < ball.radius + 0.004) {
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
    Spawner.pivotL = 0.013;
    MarbleRunSimulatorCore.Spawner = Spawner;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Speeder extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this._rotationSpeed = 0;
            this.setTemplate(this.machine.templateManager.getTemplate(Speeder.PropToPartName(prop)));
            this.generateWires();
            this.base = new BABYLON.Mesh("base");
            this.base.material = this.game.materials.getMaterial(this.getColor(0), this.machine.materialQ);
            this.base.parent = this;
            this.wheel0 = new BABYLON.Mesh("wheel0");
            this.wheel0.parent = this;
            this.wheel0.position.y = 0.006;
            this.wheel0.position.z = -0.008 - 0.006;
            this.wheel1 = new BABYLON.Mesh("wheel1");
            this.wheel1.parent = this;
            this.wheel1.position.y = 0.006;
            this.wheel1.position.z = 0.008 + 0.007;
            this.rubber0 = new BABYLON.Mesh("rubber0");
            this.rubber0.parent = this.wheel0;
            this.rubber1 = new BABYLON.Mesh("rubber1");
            this.rubber1.parent = this.wheel1;
        }
        static PropToPartName(prop) {
            return "speeder_" + prop.l.toFixed(0);
        }
        async instantiateMachineSpecific() {
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
        static GenerateTemplate(l) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "speeder_" + l;
            template.lExtendableOnX = true;
            template.l = l;
            template.h = 0;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileSize * 0.5, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileSize * (template.l - 0.5), 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90))
            ];
            template.initialize();
            return template;
        }
        update(dt) {
            super.update(dt);
            if (Math.abs(this._rotationSpeed) > 0.01) {
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
                    if (Math.abs(deltaPos.y) < MarbleRunSimulatorCore.tileHeight * 0.5) {
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
    MarbleRunSimulatorCore.Speeder = Speeder;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
/// <reference path="../machine/MachinePart.ts"/>
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Spiral extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.setTemplate(this.machine.templateManager.getTemplate(Spiral.PropToPartName(prop), prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }
        static PropToPartName(prop) {
            return "spiral_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
        }
        static GenerateTemplate(l, h) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "spiral_" + l.toFixed(0) + "." + h.toFixed(0);
            template.l = l;
            template.h = h;
            template.n = h;
            template.lExtendableOnX = true;
            template.minLAbsolute = 1;
            template.minL = -32;
            template.maxL = 32;
            template.hExtendableOnY = true;
            template.minH = 1;
            template.downwardYExtendable = true;
            template.defaultAngle = Math.PI / 6;
            template.maxAngle = Math.PI / 3;
            let x0 = -MarbleRunSimulatorCore.tileSize * 0.5;
            let x1 = MarbleRunSimulatorCore.tileSize * (template.l - 0.5);
            if (template.l < 0) {
                x0 = MarbleRunSimulatorCore.tileSize * (Math.abs(template.l) - 0.5);
                x1 = -MarbleRunSimulatorCore.tileSize * 0.5;
            }
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            //template.trackTemplates[0].preferedStartBank = - Math.PI / 10 * (template.mirrorX ? - 1 : 1);
            //template.trackTemplates[0].preferedEndBank = - Math.PI / 10 * (template.mirrorX ? - 1 : 1);
            template.trackTemplates[0].onNormalEvaluated = (n) => {
                n.copyFromFloats(0, 1, 0);
            };
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(template.l > 0 ? 90 : -90))];
            let nSpirals = template.n;
            let widthInM = Math.abs(template.l) * MarbleRunSimulatorCore.tileSize;
            let r = Math.abs(widthInM * 0.5 - 0.01);
            let heightStart = 0 - 0.003;
            let heightEnd = -MarbleRunSimulatorCore.tileHeight * template.h + 0.003;
            let x = (x0 + x1) * 0.5;
            for (let nS = 0; nS < nSpirals; nS++) {
                let nV0 = 0;
                if (nS >= 1) {
                    nV0 = 1;
                }
                for (let nV = nV0; nV <= 8; nV++) {
                    let f = ((nS * 8) + nV) / (nSpirals * 8);
                    let a = Math.sign(template.l) * (2 * Math.PI * nV) / 8;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);
                    let dir;
                    if (nV === 0 || ((nV === 8) && (nS === nSpirals - 1))) {
                        //dir = BABYLON.Vector3.Right();
                    }
                    let absZ = -r * (1 - cosa) - 0.0008 * Math.abs(template.l);
                    template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + sina * r, f * (heightEnd - heightStart) + heightStart, absZ), dir));
                }
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x1, -MarbleRunSimulatorCore.tileHeight * template.h, 0), MarbleRunSimulatorCore.Tools.V3Dir(template.l > 0 ? 90 : -90)));
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.Spiral = Spiral;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
/// <reference path="../machine/MachinePart.ts"/>
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class SpiralUTurn extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.setTemplate(this.machine.templateManager.getTemplate(SpiralUTurn.PropToPartName(prop), prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }
        static PropToPartName(prop) {
            return "spiralUTurn_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
        }
        static GenerateTemplate(l, h) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "spiralUTurn_" + l.toFixed(0) + "." + h.toFixed(0);
            template.angleSmoothSteps = 200;
            template.l = l;
            template.h = h;
            template.n = h;
            template.lExtendableOnZ = true;
            template.minLAbsolute = 1;
            template.minL = -32;
            template.maxL = 32;
            template.hExtendableOnY = true;
            template.minH = 1;
            template.downwardYExtendable = true;
            template.defaultAngle = Math.PI / 6;
            template.maxAngle = Math.PI / 3;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            //template.trackTemplates[0].preferedStartBank = - Math.PI / 10 * (template.mirrorX ? - 1 : 1);
            //template.trackTemplates[0].preferedEndBank = - Math.PI / 10 * (template.mirrorX ? - 1 : 1);
            template.trackTemplates[0].onNormalEvaluated = (n) => {
                n.copyFromFloats(0, 1, 0);
            };
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileSize * 0.5, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90))];
            let nSpirals = template.n - 1;
            let depthInM = template.l * MarbleRunSimulatorCore.tileSize;
            let r = Math.abs(depthInM * 0.5);
            let heightStart = 0 - 0.003;
            let heightEnd = -MarbleRunSimulatorCore.tileHeight * template.h + 0.003;
            let x = -MarbleRunSimulatorCore.tileSize * 0.5 + r + 0.025;
            for (let nS = 0; nS <= nSpirals; nS++) {
                let nV0 = 0;
                if (nS >= 1) {
                    nV0 = 1;
                }
                let nVMax = 8;
                if (nS === nSpirals) {
                    nVMax = 4;
                }
                for (let nV = nV0; nV <= nVMax; nV++) {
                    let f = ((nS * 8) + nV) / ((nSpirals + 0.5) * 8);
                    let a = (2 * Math.PI * nV) / 8;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);
                    let absZ = r - cosa * (r - Math.sign(template.l) * 0.0008 * template.l);
                    template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + sina * r, f * (heightEnd - heightStart) + heightStart, Math.sign(template.l) * absZ)));
                }
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileSize * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, MarbleRunSimulatorCore.tileSize * template.l), MarbleRunSimulatorCore.Tools.V3Dir(-90)));
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.SpiralUTurn = SpiralUTurn;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Split extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this._animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;
            this.axisZMin = 0;
            this.axisZMax = 1;
            this.reset = () => {
                this._exitLeft = !this.mirrorX && !this.mirrorZ;
                this._moving = false;
                if (this.mirrorX) {
                    this.pivot.rotation.z = -(this.mirrorZ ? -1 : 1) * Math.PI / 4;
                }
                else {
                    this.pivot.rotation.z = (this.mirrorZ ? -1 : 1) * Math.PI / 4;
                }
                this.pivot.freezeWorldMatrix();
                this.pivot.getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
            };
            this._exitLeft = true;
            this._moving = false;
            this.setTemplate(this.machine.templateManager.getTemplate(Split.PropToPartName(prop)));
            this.clicSound = new BABYLON.Sound("clic-sound", "./lib/marble-run-simulator-core/datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);
            for (let i = this.colors.length; i < 5; i++) {
                this.colors[i] = 0;
            }
            let rCurb = Split.pivotL * 0.3;
            this.pivot = new BABYLON.Mesh("pivot");
            this.pivot.position.copyFromFloats(0, MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            this.pivot.parent = this;
            let dz = this.wireGauge * 0.5;
            let wireHorizontal0 = new MarbleRunSimulatorCore.Wire(this);
            wireHorizontal0.colorIndex = 4;
            wireHorizontal0.parent = this.pivot;
            wireHorizontal0.path = [new BABYLON.Vector3(-Split.pivotL, 0, -dz), new BABYLON.Vector3(Split.pivotL, 0, -dz)];
            let wireHorizontal1 = new MarbleRunSimulatorCore.Wire(this);
            wireHorizontal1.colorIndex = 4;
            wireHorizontal1.parent = this.pivot;
            wireHorizontal1.path = [new BABYLON.Vector3(-Split.pivotL, 0, dz), new BABYLON.Vector3(Split.pivotL, 0, dz)];
            let wireVertical0 = new MarbleRunSimulatorCore.Wire(this);
            wireVertical0.colorIndex = 4;
            wireVertical0.parent = this.pivot;
            wireVertical0.path = [new BABYLON.Vector3(0, Split.pivotL, -dz), new BABYLON.Vector3(0, rCurb * 0.3, -dz)];
            let wireVertical1 = new MarbleRunSimulatorCore.Wire(this);
            wireVertical1.colorIndex = 4;
            wireVertical1.parent = this.pivot;
            wireVertical1.path = [new BABYLON.Vector3(0, Split.pivotL, dz), new BABYLON.Vector3(0, rCurb * 0.3, dz)];
            let curbLeft0 = new MarbleRunSimulatorCore.Wire(this);
            curbLeft0.colorIndex = 4;
            curbLeft0.wireSize = this.wireSize * 0.8;
            curbLeft0.parent = this.pivot;
            curbLeft0.path = [];
            for (let i = 0; i <= 8; i++) {
                let a = ((Math.PI / 2) * i) / 8;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                curbLeft0.path.push(new BABYLON.Vector3(-rCurb + cosa * rCurb, rCurb - sina * rCurb, -dz));
            }
            let curbLeft1 = new MarbleRunSimulatorCore.Wire(this);
            curbLeft1.colorIndex = 4;
            curbLeft1.wireSize = this.wireSize * 0.8;
            curbLeft1.parent = this.pivot;
            curbLeft1.path = [];
            for (let i = 0; i <= 8; i++) {
                let a = ((Math.PI / 2) * i) / 8;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                curbLeft1.path.push(new BABYLON.Vector3(-rCurb + cosa * rCurb, rCurb - sina * rCurb, dz));
            }
            let curbRight0 = new MarbleRunSimulatorCore.Wire(this);
            curbRight0.colorIndex = 4;
            curbRight0.wireSize = this.wireSize * 0.8;
            curbRight0.parent = this.pivot;
            curbRight0.path = [];
            for (let i = 0; i <= 8; i++) {
                let a = ((Math.PI / 2) * i) / 8;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                curbRight0.path.push(new BABYLON.Vector3(rCurb - cosa * rCurb, rCurb - sina * rCurb, -dz));
            }
            let curbRight1 = new MarbleRunSimulatorCore.Wire(this);
            curbRight1.colorIndex = 4;
            curbRight1.wireSize = this.wireSize * 0.8;
            curbRight1.parent = this.pivot;
            curbRight1.path = [];
            for (let i = 0; i <= 8; i++) {
                let a = ((Math.PI / 2) * i) / 8;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                curbRight1.path.push(new BABYLON.Vector3(rCurb - cosa * rCurb, rCurb - sina * rCurb, dz));
            }
            this.wires = [wireHorizontal0, wireHorizontal1, curbLeft0, curbLeft1, wireVertical0, wireVertical1, curbRight0, curbRight1];
            this.generateWires();
            this._animatePivot = Mummu.AnimationFactory.CreateNumber(this, this.pivot.rotation, "z", () => {
                if (!this.machine.playing) {
                    this.pivot.rotation.z = (this.mirrorZ ? -1 : 1) * Math.PI / 4;
                }
                this.pivot.freezeWorldMatrix();
                this.pivot.getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
                this.wires.forEach((wire) => {
                    wire.recomputeAbsolutePath();
                });
            }, false, Nabu.Easing.easeInSquare);
            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }
        static PropToPartName(prop) {
            return "split";
        }
        async instantiateMachineSpecific() {
            let pivotDatas = [];
            this.axisZMin = -0.015 + 0.0005;
            this.axisZMax = 0.015 - 0.0005;
            let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: this.axisZMax - this.axisZMin, diameter: 0.001 });
            let q = BABYLON.Quaternion.Identity();
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, (this.axisZMax + this.axisZMin) * 0.5));
            pivotDatas.push(tmpVertexData);
            let arrowData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon", 0);
            if (arrowData) {
                arrowData = Mummu.CloneVertexData(arrowData);
                Mummu.TranslateVertexDataInPlace(arrowData, new BABYLON.Vector3(0, 0, this.axisZMin));
                pivotDatas.push(arrowData);
                arrowData = Mummu.CloneVertexData(arrowData);
                Mummu.MirrorZVertexDataInPlace(arrowData);
                pivotDatas.push(arrowData);
            }
            Mummu.MergeVertexDatas(...pivotDatas).applyToMesh(this.pivot);
            this.pivot.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
        }
        static GenerateTemplate(mirror) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "split";
            template.mirrorZ = mirror;
            template.zMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let pEndLeft = new BABYLON.Vector3(0, MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            pEndLeft.x -= Split.pivotL / Math.SQRT2;
            pEndLeft.y += Split.pivotL / Math.SQRT2;
            let pEndRight = new BABYLON.Vector3(0, MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            pEndRight.x += Split.pivotL / Math.SQRT2;
            pEndRight.y += Split.pivotL / Math.SQRT2;
            let dirEnd = MarbleRunSimulatorCore.Tools.V3Dir(115);
            let dirEndMirror = dirEnd.multiplyByFloats(1, -1, 1);
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, MarbleRunSimulatorCore.tileHeight, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], pEndLeft.subtract(dirEnd.scale(0.0005)), dirEnd)
            ];
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(Split.pivotL / Math.SQRT2, MarbleRunSimulatorCore.tileHeight * 0.5 - Split.pivotL / Math.SQRT2, 0).subtract(dirEnd.scale(0.0005)), dirEnd),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir)
            ];
            template.trackTemplates[2] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 2;
            template.trackTemplates[2].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(-Split.pivotL / Math.SQRT2, MarbleRunSimulatorCore.tileHeight * 0.5 - Split.pivotL / Math.SQRT2, 0).subtract(dirEndMirror.scale(0.0005)), dirEndMirror)
            ];
            template.trackTemplates[3] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[3].colorIndex = 3;
            template.trackTemplates[3].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.25, MarbleRunSimulatorCore.tileHeight + 0.016, 0), MarbleRunSimulatorCore.Tools.V3Dir(100), new BABYLON.Vector3(0, -1, 0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], pEndRight.add(MarbleRunSimulatorCore.Tools.V3Dir(45, 0.003)), MarbleRunSimulatorCore.Tools.V3Dir(135), MarbleRunSimulatorCore.Tools.V3Dir(225)),
            ];
            template.trackTemplates[3].drawStartTip = true;
            template.trackTemplates[3].drawEndTip = true;
            template.trackTemplates[3].noMiniatureRender = true;
            template.initialize();
            return template;
        }
        dispose() {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }
        update(dt) {
            super.update(dt);
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivot.absolutePosition) < 0.02) {
                        let local = BABYLON.Vector3.TransformCoordinates(ball.position, this.pivot.getWorldMatrix().clone().invert());
                        if (local.y < ball.radius * 0.9 && Math.abs(local.z) < 0.001) {
                            if (this._exitLeft && local.x > ball.radius * 0.5 && local.x < Split.pivotL) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(-Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                        this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                                        this.clicSound.play();
                                        this._moving = false;
                                        this._exitLeft = false;
                                    });
                                }, 150 / this.game.currentTimeFactor);
                                return;
                            }
                            else if (!this._exitLeft && local.x > -Split.pivotL && local.x < -ball.radius * 0.5) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                        this.clicSound.setPlaybackRate(this.game.currentTimeFactor);
                                        this.clicSound.play();
                                        this._moving = false;
                                        this._exitLeft = true;
                                    });
                                }, 150 / this.game.currentTimeFactor);
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    Split.pivotL = 0.013;
    MarbleRunSimulatorCore.Split = Split;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Stairway extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.boxesCount = 4;
            this.boxesColliders = [];
            this.boxesDisplayedMesh = [];
            this.bielles = [];
            this.x0 = 0;
            this.x1 = 0;
            this.stepW = 0;
            this.y0 = 0;
            this.y1 = 0;
            this.stepH = 0;
            this.dH = 0.002;
            this.reset = () => {
                this.a = Math.PI * 0.5;
                this.update(0);
            };
            this.length = 0;
            this.p = 0;
            this.speed = Math.PI; // in m/s
            this.a = 0;
            this.setTemplate(this.machine.templateManager.getTemplate(Stairway.PropToPartName(prop)));
            for (let i = this.colors.length; i < 4; i++) {
                this.colors[i] = 0;
            }
            this.x0 = -MarbleRunSimulatorCore.tileWidth * 0.3;
            this.x1 = MarbleRunSimulatorCore.tileWidth * 0.3 + (this.l - 3) * MarbleRunSimulatorCore.tileSize;
            this.boxesCount = Math.round((this.x1 - this.x0) / 0.02);
            this.stepW = (this.x1 - this.x0) / this.boxesCount;
            this.y0 = -MarbleRunSimulatorCore.tileHeight * (this.h + 0.05) - 0.005 + MarbleRunSimulatorCore.tileHeight * this.h;
            this.y1 = MarbleRunSimulatorCore.tileHeight * 0.05 + 0.005 + MarbleRunSimulatorCore.tileHeight * this.h;
            this.stepH = Math.abs((this.y1 - this.y0) / this.boxesCount);
            for (let i = 0; i < this.boxesCount; i++) {
                let data = Stairway.MakeStairwayColliderVertexData(this.stepW, this.stepH * 2, 0.02, this.dH, 0.001);
                let box = new BABYLON.Mesh("collider_" + i);
                this.boxesColliders[i] = box;
                this.boxesDisplayedMesh[i] = new BABYLON.Mesh("display-box_" + i);
                box.isVisible = false;
                data.applyToMesh(box);
                box.parent = this;
                let fX = i / this.boxesCount;
                box.position.x = (1 - fX) * this.x0 + fX * this.x1 + this.stepW * 0.5;
                let fY = (i + 0.5) / this.boxesCount;
                box.position.y = (1 - fY) * this.y0 + fY * this.y1 - this.stepH;
                this.bielles[i] = new BABYLON.Mesh("bielle");
            }
            this.vil = new BABYLON.Mesh("display-vil");
            this.vil.position.y = -MarbleRunSimulatorCore.tileHeight * (this.h + 1.5) + MarbleRunSimulatorCore.tileHeight * this.h;
            this.vil.parent = this;
            this.generateWires();
            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }
        static MakeStairwayColliderVertexData(width, height, depth, dH, radius = 0.001) {
            let path = [new BABYLON.Vector2(-width * 0.5, -height * 0.5)];
            let left = -width * 0.5;
            let top = height * 0.5;
            for (let i = 0; i <= 6; i++) {
                let a = ((i / 6) * Math.PI) / 2;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                let v = new BABYLON.Vector2(left, top + dH);
                v.x += (1 - cosa) * radius;
                v.y -= (1 - sina) * radius;
                path.push(v);
            }
            path.push(new BABYLON.Vector2(width * 0.5, height * 0.5));
            let data = new BABYLON.VertexData();
            let positions = [];
            let indices = [];
            for (let i = 0; i < path.length; i++) {
                let p = path[i];
                let l = positions.length / 3;
                positions.push(p.x, p.y, depth * 0.5);
                positions.push(p.x, p.y, -depth * 0.5);
                if (i < path.length - 1) {
                    indices.push(l, l + 1, l + 3);
                    indices.push(l, l + 3, l + 2);
                }
            }
            data.positions = positions;
            data.indices = indices;
            let normals = [];
            BABYLON.VertexData.ComputeNormals(positions, indices, normals);
            data.normals = normals;
            return data;
        }
        static PropToPartName(prop) {
            let partName = "stairway_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
            return partName;
        }
        async instantiateMachineSpecific() {
            for (let i = 0; i < this.boxesCount; i++) {
                let fY = (i + 0.5) / this.boxesCount;
                let l = ((1 - fY) * this.y0 + fY * this.y1 - this.stepH - this.dH * 0.5) - -MarbleRunSimulatorCore.tileHeight * (this.h + 1.5) + this.stepH - 0.002 - MarbleRunSimulatorCore.tileHeight * this.h;
                let vertexData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/stairway-bielle.babylon", 0);
                vertexData = Mummu.CloneVertexData(vertexData);
                let positions = vertexData.positions;
                for (let p = 0; p < positions.length / 3; p++) {
                    let y = positions[3 * p + 1];
                    if (y > 0.005) {
                        positions[3 * p + 1] -= 0.01;
                        positions[3 * p + 1] += l;
                    }
                }
                vertexData.positions = positions;
                let normals = [];
                BABYLON.VertexData.ComputeNormals(vertexData.positions, vertexData.indices, normals);
                vertexData.normals = normals;
                vertexData.applyToMesh(this.bielles[i]);
                this.bielles[i].material = this.game.materials.getMaterial(this.getColor(2), this.machine.materialQ);
                let stepVertexData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/stairway-step.babylon", 0);
                stepVertexData = Mummu.CloneVertexData(stepVertexData);
                positions = stepVertexData.positions;
                for (let p = 0; p < positions.length / 3; p++) {
                    let x = positions[3 * p];
                    let y = positions[3 * p + 1];
                    let z = positions[3 * p + 2];
                    if (x < 0) {
                        positions[3 * p] += 0.005;
                        positions[3 * p] -= this.stepW * 0.5;
                    }
                    else {
                        positions[3 * p] -= 0.005;
                        positions[3 * p] += this.stepW * 0.5;
                    }
                    if (y < 0) {
                        positions[3 * p + 1] += 0.005;
                        positions[3 * p + 1] -= this.stepH;
                    }
                    else {
                        positions[3 * p + 1] -= 0.005;
                        positions[3 * p + 1] += this.stepH;
                    }
                    if (z < 0) {
                        positions[3 * p + 2] += 0.005;
                        positions[3 * p + 2] -= 0.01;
                    }
                    else {
                        positions[3 * p + 2] -= 0.005;
                        positions[3 * p + 2] += 0.01;
                    }
                    if (x < 0 && y > 0) {
                        positions[3 * p + 1] += this.dH;
                    }
                    else if (y < 0) {
                        positions[3 * p + 1] -= this.dH;
                    }
                    if (x < 0) {
                        positions[3 * p] += 0.0002;
                    }
                    else {
                        positions[3 * p] -= 0.0002;
                    }
                }
                stepVertexData.positions = positions;
                stepVertexData.applyToMesh(this.boxesDisplayedMesh[i]);
                this.boxesDisplayedMesh[i].parent = this.boxesColliders[i];
                this.boxesDisplayedMesh[i].material = this.game.materials.getMaterial(this.getColor(1), this.machine.materialQ);
            }
            let vertexData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/stairway-vil.babylon", 0);
            vertexData = Mummu.CloneVertexData(vertexData);
            let positions = vertexData.positions;
            for (let p = 0; p < positions.length / 3; p++) {
                let x = positions[3 * p];
                let y = positions[3 * p + 1];
                let z = positions[3 * p + 2];
                if (x < -0.0045) {
                    positions[3 * p] += 0.005;
                    positions[3 * p] -= this.stepW * 0.5;
                }
                else if (x > 0.0045) {
                    positions[3 * p] -= 0.005;
                    positions[3 * p] += this.stepW * 0.5;
                }
                if (y > 0.005) {
                    positions[3 * p + 1] -= 0.01;
                    positions[3 * p + 1] += (this.stepH * 0.5 + this.dH * 0.5);
                }
            }
            vertexData.positions = positions;
            let vilPartsDatas = [];
            let altQ = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.X, Math.PI);
            for (let i = 0; i < this.boxesCount; i++) {
                let partData = Mummu.CloneVertexData(vertexData);
                let fX = i / this.boxesCount;
                let x = (1 - fX) * this.x0 + fX * this.x1 + this.stepW * 0.5;
                if (i % 2 === 1) {
                    Mummu.RotateVertexDataInPlace(partData, altQ);
                }
                Mummu.TranslateVertexDataInPlace(partData, new BABYLON.Vector3(x, 0, 0));
                vilPartsDatas.push(partData);
            }
            let wheelData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/wheel.babylon", 1);
            let wheel0Data = Mummu.CloneVertexData(wheelData);
            //Mummu.ScaleVertexDataInPlace(wheel0Data, 0.03);
            Mummu.RotateVertexDataInPlace(wheel0Data, BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI * 0.5));
            Mummu.TranslateVertexDataInPlace(wheel0Data, new BABYLON.Vector3(this.x0 - 0.001, 0, 0));
            let wheel1Data = Mummu.CloneVertexData(wheelData);
            //Mummu.ScaleVertexDataInPlace(wheel1Data, 0.03);
            Mummu.RotateVertexDataInPlace(wheel1Data, BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI * 0.5));
            Mummu.TranslateVertexDataInPlace(wheel1Data, new BABYLON.Vector3(this.x1 + 0.001, 0, 0));
            Mummu.MergeVertexDatas(...vilPartsDatas, wheel0Data, wheel1Data).applyToMesh(this.vil);
            this.vil.material = this.game.materials.getMaterial(this.getColor(3), this.machine.materialQ);
        }
        static GenerateTemplate(l, h) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            if (isNaN(h)) {
                debugger;
            }
            template.partName = "stairway_" + l.toFixed(0) + "." + h.toFixed(0);
            template.l = l;
            template.h = h;
            template.minL = 3;
            template.minH = 1;
            template.lExtendableOnX = true;
            template.hExtendableOnY = true;
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
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.3, -0.001, 0), dir)
            ];
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3((template.l - 3) * MarbleRunSimulatorCore.tileSize + MarbleRunSimulatorCore.tileWidth * 0.3, MarbleRunSimulatorCore.tileHeight * h + 0.001 - 0.02, 0), MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(-90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3((template.l - 3) * MarbleRunSimulatorCore.tileSize + MarbleRunSimulatorCore.tileWidth * 0.3, MarbleRunSimulatorCore.tileHeight * h + 0.001 - 0.003, 0), MarbleRunSimulatorCore.Tools.V3Dir(0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3((template.l - 3) * MarbleRunSimulatorCore.tileSize + MarbleRunSimulatorCore.tileWidth * 0.3 + 0.003, MarbleRunSimulatorCore.tileHeight * h + 0.001, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3((template.l - 3) * MarbleRunSimulatorCore.tileSize + MarbleRunSimulatorCore.tileWidth * 0.5, MarbleRunSimulatorCore.tileHeight * h, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
            ];
            template.trackTemplates[1].drawStartTip = true;
            template.initialize();
            let x0 = -MarbleRunSimulatorCore.tileWidth * 0.3;
            let x1 = MarbleRunSimulatorCore.tileWidth * 0.3 + (l - 3) * MarbleRunSimulatorCore.tileSize;
            let boxesCount = Math.round((x1 - x0) / 0.02);
            let stepW = (x1 - x0) / boxesCount;
            for (let i = 0; i < boxesCount; i++) {
                let f = i / (boxesCount - 1);
                let dx = x0 + stepW * (i + 0.5);
                let shape = new MarbleRunSimulatorCore.MiniatureShape();
                shape.points = [
                    new BABYLON.Vector3(-stepW * 0.5 + dx, f * MarbleRunSimulatorCore.tileHeight * h, -stepW * 0.5),
                    new BABYLON.Vector3(stepW * 0.5 + dx, f * MarbleRunSimulatorCore.tileHeight * h, -stepW * 0.5),
                    new BABYLON.Vector3(stepW * 0.5 + dx, f * MarbleRunSimulatorCore.tileHeight * h, stepW * 0.5),
                    new BABYLON.Vector3(-stepW * 0.5 + dx, f * MarbleRunSimulatorCore.tileHeight * h, stepW * 0.5)
                ];
                template.miniatureShapes.push(shape);
            }
            return template;
        }
        dispose() {
            super.dispose();
            this.bielles.forEach((bielle) => {
                bielle.dispose();
            });
            this.machine.onStopCallbacks.remove(this.reset);
        }
        update(dt) {
            super.update(dt);
            let dA = this.speed * dt * this.game.currentTimeFactor;
            let x = 1;
            this.a = this.a + dA;
            while (this.a > 2 * Math.PI) {
                this.a -= 2 * Math.PI;
            }
            this.vil.rotation.x = this.a;
            this.vil.freezeWorldMatrix();
            for (let i = 0; i < this.boxesColliders.length; i++) {
                let a = this.a;
                if (i % 2 === 1) {
                    a += Math.PI;
                }
                let box = this.boxesColliders[i];
                let fY = (i + 0.5) / this.boxesCount;
                box.position.y = (1 - fY) * this.y0 + fY * this.y1 - this.stepH - this.dH * 0.5;
                box.position.y += Math.cos(a) * (this.stepH * 0.5 + this.dH * 0.5);
                this.boxesColliders[i].freezeWorldMatrix();
                this.boxesColliders[i].getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
                this.bielles[i].position.copyFromFloats(0, 0, 0);
                let fX = i / this.boxesCount;
                this.bielles[i].position.x += (1 - fX) * this.x0 + fX * this.x1 + this.stepW * 0.5;
                this.bielles[i].position.y += Math.cos(a) * (this.stepH * 0.5 + this.dH * 0.5) - MarbleRunSimulatorCore.tileHeight * (this.h + 1.5) + MarbleRunSimulatorCore.tileHeight * this.h;
                this.bielles[i].position.z += Math.sin(a) * (this.stepH * 0.5 + this.dH * 0.5);
                BABYLON.Vector3.TransformCoordinatesToRef(this.bielles[i].position, this.getWorldMatrix(), this.bielles[i].position);
                let dir = this.boxesColliders[i].absolutePosition.subtract(this.bielles[i].absolutePosition).addInPlaceFromFloats(0, this.stepH - 0.002, 0);
                this.bielles[i].rotationQuaternion = Mummu.QuaternionFromYZAxis(dir, BABYLON.Axis.Z);
            }
        }
    }
    MarbleRunSimulatorCore.Stairway = Stairway;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Start extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.setTemplate(this.machine.templateManager.getTemplate(Start.PropToPartName(prop)));
            this.generateWires();
        }
        static PropToPartName(prop) {
            return "start";
        }
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "start";
            template.h = 0;
            template.mirrorX = mirrorX;
            template.xMirrorable = true;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0.008, 0), MarbleRunSimulatorCore.Tools.V3Dir(110)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90))
            ];
            template.trackTemplates[0].drawStartTip = true;
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.Start = Start;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class SteamElevator extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.speed = 0.05; // in m/s
            this.x = 0;
            this.rLargeWheel = 0.045;
            this.rSmallWheel = 0.01;
            this.rGear = 0.022;
            this.pGear = 1;
            this.chainLength = 1;
            this.baseChainUVs = [];
            this.reset = () => {
                this.update(0);
            };
            let partName = "steamelevator_" + prop.h.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            let x = 1;
            if (prop.mirrorX) {
                x = -1;
            }
            this.gearTop = new BABYLON.Mesh("gearTop");
            this.gearTop.position.x = MarbleRunSimulatorCore.tileWidth;
            this.gearTop.position.y = 0;
            this.gearTop.parent = this;
            this.gearBottom = new BABYLON.Mesh("gearBottom");
            this.gearBottom.position.x = MarbleRunSimulatorCore.tileWidth;
            this.gearBottom.position.y = -MarbleRunSimulatorCore.tileHeight * this.h;
            this.gearBottom.parent = this;
            this.largeWheel = new BABYLON.Mesh("largeWheel");
            this.largeWheel.position.z = -0.035;
            this.largeWheel.parent = this.gearBottom;
            this.engineAxis = new BABYLON.Mesh("engineAxis");
            this.engineAxis.position.x = MarbleRunSimulatorCore.tileWidth;
            this.engineAxis.position.y = -MarbleRunSimulatorCore.tileHeight * this.h - 0.07;
            this.engineAxis.parent = this;
            this.flyWheel = new BABYLON.Mesh("flyWheel");
            this.flyWheel.position.z = 0.035;
            this.flyWheel.parent = this.engineAxis;
            this.smallWheel = new BABYLON.Mesh("smallWheel");
            this.smallWheel.position.z = -0.035;
            this.smallWheel.parent = this.engineAxis;
            this.pistonBody = new BABYLON.Mesh("pistonBody");
            this.pistonBody.position.x = MarbleRunSimulatorCore.tileWidth - 0.04;
            this.pistonBody.position.y = -MarbleRunSimulatorCore.tileHeight * this.h - 0.07;
            this.pistonBody.parent = this;
            this.pistonMove = new BABYLON.Mesh("pistonMove");
            this.pistonMove.parent = this.pistonBody;
            this.pistonBielle = new BABYLON.Mesh("pistonBielle");
            this.pistonBielle.parent = this.pistonMove;
            this.pGear = 2 * Math.PI * this.rGear;
            this.chainLength = 2 * MarbleRunSimulatorCore.tileHeight * this.h + this.pGear;
            this.chain = new BABYLON.Mesh("chain");
            this.chain.parent = this;
            this.chain.material = this.game.materials.chainMaterial;
            this.courroie = new BABYLON.Mesh("courroie");
            this.courroie.position.z = -0.035;
            this.courroie.scaling.z = 1.25;
            this.courroie.parent = this;
            this.generateWires();
            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }
        async instantiateMachineSpecific() {
            let datas = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/steampunk-elevator.babylon");
            datas[0].applyToMesh(this.gearTop);
            this.gearTop.material = this.game.materials.getMaterial(1, this.machine.materialQ);
            datas[0].applyToMesh(this.gearBottom);
            this.gearBottom.material = this.game.materials.getMaterial(1, this.machine.materialQ);
            datas[1].applyToMesh(this.flyWheel);
            this.flyWheel.material = this.game.materials.getMaterial(1, this.machine.materialQ);
            datas[2].applyToMesh(this.largeWheel);
            this.largeWheel.material = this.game.materials.getMaterial(1, this.machine.materialQ);
            datas[3].applyToMesh(this.smallWheel);
            this.smallWheel.material = this.game.materials.getMaterial(1, this.machine.materialQ);
            datas[4].applyToMesh(this.engineAxis);
            this.engineAxis.material = this.game.materials.getMaterial(1, this.machine.materialQ);
            datas[5].applyToMesh(this.pistonBielle);
            this.pistonBielle.material = this.game.materials.getMaterial(1, this.machine.materialQ);
            datas[6].applyToMesh(this.pistonMove);
            this.pistonMove.material = this.game.materials.getMaterial(1, this.machine.materialQ);
            datas[7].applyToMesh(this.pistonBody);
            this.pistonBody.material = this.game.materials.getMaterial(1, this.machine.materialQ);
            let nCable = 6;
            let rChain = 0.003;
            let x0 = this.gearBottom.position.x;
            let y0 = this.gearBottom.position.y;
            let pathCable = [];
            for (let i = 0; i <= 12; i++) {
                let a = (i / 12) * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                pathCable.push(new BABYLON.Vector3(x0 + cosa * this.rGear, y0 - sina * this.rGear));
            }
            x0 = this.gearTop.position.x;
            y0 = this.gearTop.position.y;
            for (let i = 0; i < 12; i++) {
                let a = (i / 12) * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                pathCable.push(new BABYLON.Vector3(x0 - cosa * this.rGear, y0 + sina * this.rGear));
            }
            let chainData = Mummu.CreateWireVertexData({ path: pathCable, tesselation: 4, radius: rChain, color: new BABYLON.Color4(1, 1, 1, 1), closed: true, textureRatio: 1.2, bissectFirstRayon: true });
            this.baseChainUVs = [...chainData.uvs];
            for (let i = 0; i < this.baseChainUVs.length / 2; i++) {
                this.baseChainUVs[2 * i + 1] += 0.25;
            }
            chainData.uvs = this.baseChainUVs;
            chainData.applyToMesh(this.chain);
            let rCourroie = 0.002;
            x0 = this.engineAxis.position.x;
            y0 = this.engineAxis.position.y;
            pathCable = [];
            for (let i = 0; i <= 16; i++) {
                let a = Math.PI / 10 + (i / 16) * 8 * Math.PI / 10;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                pathCable.push(new BABYLON.Vector3(x0 + cosa * this.rSmallWheel, y0 - sina * this.rSmallWheel));
            }
            x0 = this.gearBottom.position.x;
            y0 = this.gearBottom.position.y;
            for (let i = 0; i <= 16; i++) {
                let a = -Math.PI / 10 + (i / 16) * 12 * Math.PI / 10;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                pathCable.push(new BABYLON.Vector3(x0 - cosa * this.rLargeWheel, y0 + sina * this.rLargeWheel));
            }
            let courroieData = Mummu.CreateWireVertexData({ path: pathCable, tesselation: 4, radius: rCourroie, color: new BABYLON.Color4(1, 1, 1, 1), closed: true, textureRatio: 4, bissectFirstRayon: true });
            courroieData.applyToMesh(this.courroie);
        }
        static GenerateTemplate(h, mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "steamelevator_" + h.toFixed(0);
            template.l = 2;
            template.h = h;
            template.mirrorX = mirrorX;
            template.minH = 3;
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
            let cupR = 0.008;
            let dH = 0.002;
            let vertX = MarbleRunSimulatorCore.tileWidth * 0.5 + 0.01 - cupR;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * h, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX - 1.6 * cupR, -MarbleRunSimulatorCore.tileHeight * h - dH, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX - 0, -MarbleRunSimulatorCore.tileHeight * h - dH - cupR * 0.6, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX + cupR, -MarbleRunSimulatorCore.tileHeight * h - dH, 0), n),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX + cupR, -MarbleRunSimulatorCore.tileHeight, 0), n),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX + cupR - 0.015, 0.035 - MarbleRunSimulatorCore.tileHeight, 0), new BABYLON.Vector3(-1, 1, 0).normalize(), new BABYLON.Vector3(-1, -1, 0).normalize()),
            ];
            template.trackTemplates[0].drawEndTip = true;
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight, 0), dirLeft),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-0.008 + MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * 0.5, 0), dirRight)
            ];
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
            return template;
        }
        dispose() {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }
        update(dt) {
            super.update(dt);
            this.x += this.speed * dt;
            while (this.x > this.chainLength) {
                this.x -= this.chainLength;
            }
            let deltaAngle = -(this.speed * dt / this.pGear) * 2 * Math.PI;
            this.gearBottom.rotation.z += deltaAngle;
            this.gearBottom.rotation.z = Nabu.In0_2PIRange(this.gearBottom.rotation.z);
            let newCablesUvs = [...this.baseChainUVs];
            for (let i = 0; i < newCablesUvs.length / 2; i++) {
                newCablesUvs[2 * i + 1] += this.gearTop.rotation.z / (2 * Math.PI) * 12 * 0.5;
            }
            this.chain.setVerticesData(BABYLON.VertexBuffer.UVKind, newCablesUvs);
            this.gearTop.rotation.z += deltaAngle;
            this.gearTop.rotation.z = Nabu.In0_2PIRange(this.gearTop.rotation.z);
            this.engineAxis.rotation.z += (this.rLargeWheel / this.rSmallWheel) * deltaAngle;
            this.engineAxis.rotation.z = Nabu.In0_2PIRange(this.engineAxis.rotation.z);
            let xOff = 0.01 * Math.cos(this.engineAxis.rotation.z);
            let yOff = 0.01 * Math.sin(this.engineAxis.rotation.z);
            let pistonBielleLength = 0.04;
            let d = Math.sqrt(pistonBielleLength * pistonBielleLength - yOff * yOff);
            this.pistonMove.position.x = 0.04 - (d - xOff);
            this.pistonBielle.rotation.z = Math.atan(yOff / d);
            this.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
        }
    }
    MarbleRunSimulatorCore.SteamElevator = SteamElevator;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class TrikeSkull extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.setTemplate(this.machine.templateManager.getTemplate(TrikeSkull.PropToPartName(prop)));
            this.skull = new BABYLON.Mesh("skull");
            this.skull.parent = this;
            this.skull.material = this.game.materials.bone;
            this.generateWires();
        }
        static PropToPartName(prop) {
            return "trikeSkull";
        }
        async instantiateMachineSpecific() {
            let triceratopsVertexData = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/triceratops.babylon");
            triceratopsVertexData[0].applyToMesh(this.skull);
        }
        static GenerateTemplate() {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "trikeSkull";
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileSize * 11.5, MarbleRunSimulatorCore.tileHeight * 12, 0), MarbleRunSimulatorCore.Tools.V3Dir(90), MarbleRunSimulatorCore.Tools.V3Dir(0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileSize * 2, MarbleRunSimulatorCore.tileHeight * 8, 0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileSize * 8.5, MarbleRunSimulatorCore.tileHeight * 10, 0), MarbleRunSimulatorCore.Tools.V3Dir(90), MarbleRunSimulatorCore.Tools.V3Dir(0)),
            ];
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.TrikeSkull = TrikeSkull;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class UTurn extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.setTemplate(this.machine.templateManager.getTemplate(UTurn.PropToPartName(prop)));
            this.generateWires();
        }
        static PropToPartName(prop) {
            let partName = (prop.pipeVersion ? "pipe" : "") + (prop.woodVersion ? "wood" : "") + "uturn_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
            if (!prop.pipeVersion && !prop.woodVersion) {
                partName += "." + prop.s.toFixed(0);
            }
            return partName;
        }
        static GenerateTemplate(l, h, s, pipeVersion, woodVersion) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = (pipeVersion ? "pipe" : "") + (woodVersion ? "wood" : "") + "uturn_" + l.toFixed(0) + "." + h.toFixed(0);
            if (!pipeVersion && !woodVersion) {
                template.partName += "." + s.toFixed(0);
            }
            template.angleSmoothSteps = 50;
            template.l = l;
            template.h = h;
            template.s = s;
            template.lExtendableOnZ = true;
            template.hExtendableOnY = true;
            if (!pipeVersion) {
                template.sExtendable = true;
            }
            template.minH = -32;
            template.maxH = 32;
            template.minD = 2;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let legacyR = MarbleRunSimulatorCore.legacyTileDepth * (l / 3) * 0.5;
            let legacyX0 = -MarbleRunSimulatorCore.tileSize * 0.5 + (2 * Math.PI * legacyR) / 6;
            let legacyXMax = legacyX0 + legacyR;
            let r = MarbleRunSimulatorCore.tileSize * l * 0.5;
            let x0 = legacyXMax - r;
            let hasStraightPart = true;
            if (x0 < -MarbleRunSimulatorCore.tileSize * 0.5) {
                x0 = 0;
                hasStraightPart = false;
            }
            let r2 = r / Math.SQRT2;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].isPipe = pipeVersion;
            template.trackTemplates[0].isWood = woodVersion;
            template.trackTemplates[0].trackpoints = [];
            if (hasStraightPart) {
                template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileSize * 0.5, 0, 0), new BABYLON.Vector3(1, 0, 0)));
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + 0, 0, 0)), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r2, 0, r - r2)), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r, 0, r)), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r2, 0, r + r2)), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + 0, 0, 2 * r)));
            if (hasStraightPart) {
                template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileSize * 0.5, 0, 2 * r), new BABYLON.Vector3(-1, 0, 0)));
            }
            template.defaultAngle = Math.PI / 4 / 4 * template.s;
            template.maxAngle = Math.PI / 4 / 2 * template.s;
            let hermite = (x) => {
                return (3 * Math.pow(2 * x, 2) - Math.pow(2 * x, 3)) / 4;
            };
            let summedLength = [0];
            let trackpoints = template.trackTemplates[0].trackpoints;
            for (let n = 1; n < trackpoints.length; n++) {
                summedLength[n] = summedLength[n - 1] + BABYLON.Vector3.Distance(trackpoints[n].position, trackpoints[n - 1].position);
            }
            let totalLength = summedLength[summedLength.length - 1];
            for (let n = 0; n < template.trackTemplates[0].trackpoints.length; n++) {
                let f = summedLength[n] / totalLength;
                f = hermite(f);
                template.trackTemplates[0].trackpoints[n].position.y = f * template.h * MarbleRunSimulatorCore.tileHeight;
            }
            let tp1 = trackpoints[1];
            let dir1 = trackpoints[2].position.subtract(trackpoints[1].position);
            dir1.normalize();
            let a = Mummu.AngleFromToAround(dir1, BABYLON.Axis.X, BABYLON.Axis.Y);
            Mummu.RotateInPlace(dir1, BABYLON.Axis.Y, a);
            tp1.setDir(dir1);
            let tp2 = trackpoints[trackpoints.length - 2];
            let dir2 = trackpoints[trackpoints.length - 2].position.subtract(trackpoints[trackpoints.length - 3].position);
            dir2.normalize();
            a = Mummu.AngleFromToAround(dir2, BABYLON.Axis.X.scale(-1), BABYLON.Axis.Y);
            Mummu.RotateInPlace(dir2, BABYLON.Axis.Y, a);
            tp2.setDir(dir2);
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.UTurn = UTurn;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class UTurnSharp extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            if (isNaN(prop.h)) {
                prop.h = 1;
            }
            this.setTemplate(this.machine.templateManager.getTemplate(UTurnSharp.PropToPartName(prop)));
            for (let i = this.colors.length; i < 2; i++) {
                this.colors[i] = 0;
            }
            this.generateWires();
        }
        static PropToPartName(prop) {
            let partName = "uturnsharp_" + prop.h.toFixed(0);
            return partName;
        }
        static GenerateTemplate(h) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            if (isNaN(h)) {
                h = 1;
            }
            template.partName = "uturnsharp_" + h.toFixed(0);
            template.h = h;
            template.hExtendableOnY = true;
            template.xMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let dY = 0.014;
            let yTop = MarbleRunSimulatorCore.tileHeight * template.h;
            let yBottom = 0;
            let cY = (yTop + yBottom + dY) * 0.5;
            let rTop = Math.abs(yTop - cY);
            let rBottom = Math.abs(yBottom - cY);
            let aMaxTop = Math.PI * 0.5 + 0.02 / (rTop);
            aMaxTop = Nabu.MinMax(aMaxTop, 0, Math.PI);
            let endAngle = 120;
            let dirJoin = MarbleRunSimulatorCore.Tools.V3Dir(endAngle);
            let nJoin = MarbleRunSimulatorCore.Tools.V3Dir(endAngle - 90);
            let pEnd = new BABYLON.Vector3(-0.01, -MarbleRunSimulatorCore.tileHeight * 0.3, 0);
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, yBottom, 0), MarbleRunSimulatorCore.Tools.V3Dir(90), MarbleRunSimulatorCore.Tools.V3Dir(0))
            ];
            template.trackTemplates[0].colorIndex = 1;
            template.trackTemplates[0].drawEndTip = true;
            for (let a = 4; a > 0; a--) {
                let f = a / 4;
                let angle = Math.PI * f;
                let cosa = Math.cos(angle);
                let sina = Math.sin(angle);
                let dir = MarbleRunSimulatorCore.Tools.V3Dir(angle / Math.PI * 180 - 90);
                let norm = MarbleRunSimulatorCore.Tools.V3Dir(-angle / Math.PI * 180);
                let p = new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5 + dY, cY, 0);
                p.x += sina * rBottom;
                p.y += cosa * rBottom;
                template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], p, dir, norm));
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5 + dY, cY + rBottom, 0), MarbleRunSimulatorCore.Tools.V3Dir(-90), MarbleRunSimulatorCore.Tools.V3Dir(-180)));
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 0;
            template.trackTemplates[1].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, yTop, 0), MarbleRunSimulatorCore.Tools.V3Dir(90), MarbleRunSimulatorCore.Tools.V3Dir(0))];
            template.trackTemplates[1].drawEndTip = true;
            template.trackTemplates[1].noMiniatureRender = true;
            for (let a = 0; a <= 4; a++) {
                let f = a / 4;
                let angle = Math.PI * f;
                let cosa = Math.cos(angle);
                let sina = Math.sin(angle);
                let dir = MarbleRunSimulatorCore.Tools.V3Dir(angle / Math.PI * 180 + 90);
                let norm = MarbleRunSimulatorCore.Tools.V3Dir(angle / Math.PI * 180);
                if (angle < aMaxTop) {
                    let p = new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5 + dY, cY, 0);
                    p.x += sina * rTop;
                    p.y += cosa * rTop;
                    template.trackTemplates[1].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], p, dir, norm));
                }
            }
            template.trackTemplates[1].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5 + dY + Math.sin(aMaxTop) * rTop, cY + Math.cos(aMaxTop) * rTop, 0), MarbleRunSimulatorCore.Tools.V3Dir(aMaxTop / Math.PI * 180 + 90), MarbleRunSimulatorCore.Tools.V3Dir(aMaxTop / Math.PI * 180)));
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.UTurnSharp = UTurnSharp;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class UTurnV2 extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            let partName = (prop.pipeVersion ? "pipe" : "") + (prop.woodVersion ? "wood" : "") + "uturnv2_" + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
            if (!prop.pipeVersion && !prop.woodVersion) {
                partName += "." + prop.s.toFixed(0);
            }
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }
        static GenerateTemplate(h, d, s, mirrorX, mirrorZ, pipeVersion, woodVersion) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.getWidthForDepth = (argD) => {
                if (argD >= 8) {
                    return argD - 2;
                }
                return argD - 1;
            };
            template.partName = (pipeVersion ? "pipe" : "") + (woodVersion ? "wood" : "") + "uturnv2_" + h.toFixed(0) + "." + d.toFixed(0);
            if (!pipeVersion && !woodVersion) {
                template.partName += "." + s.toFixed(0);
            }
            template.angleSmoothSteps = 50;
            template.l = template.getWidthForDepth(d);
            template.h = h;
            template.d = d;
            template.s = s;
            template.mirrorX = mirrorX;
            template.mirrorZ = mirrorZ;
            template.yExtendable = true;
            template.zExtendable = true;
            if (!pipeVersion) {
                template.sExtendable = true;
            }
            template.minD = 2;
            template.xMirrorable = true;
            template.zMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let r = MarbleRunSimulatorCore.tileDepth * (d - 1) * 0.5;
            let x0 = -MarbleRunSimulatorCore.tileWidth * 0.5;
            let r2 = r / Math.SQRT2;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].isPipe = pipeVersion;
            template.trackTemplates[0].isWood = woodVersion;
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + 0, 0, 0), new BABYLON.Vector3(1, 0, 0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r2, 0, -r + r2)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r, 0, -r)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r2, 0, -r - r2)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + 0, 0, -2 * r), new BABYLON.Vector3(-1, 0, 0)),
            ];
            template.maxAngle = Math.PI / 4 / 2 * template.s;
            let hermite = (x) => {
                return (3 * Math.pow(2 * x, 2) - Math.pow(2 * x, 3)) / 4;
            };
            let summedLength = [0];
            let trackpoints = template.trackTemplates[0].trackpoints;
            for (let n = 1; n < trackpoints.length; n++) {
                summedLength[n] = summedLength[n - 1] + BABYLON.Vector3.Distance(trackpoints[n].position, trackpoints[n - 1].position);
            }
            let totalLength = summedLength[summedLength.length - 1];
            for (let n = 0; n < template.trackTemplates[0].trackpoints.length; n++) {
                let f = summedLength[n] / totalLength;
                f = hermite(f);
                template.trackTemplates[0].trackpoints[n].position.y = -f * template.h * MarbleRunSimulatorCore.tileHeight;
            }
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            if (mirrorZ) {
                template.mirrorZTrackPointsInPlace();
            }
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.UTurnV2 = UTurnV2;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Wall extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.setTemplate(this.machine.templateManager.getTemplate(Wall.PropToPartName(prop)));
            this.generateWires();
        }
        static PropToPartName(prop) {
            let partName = "wall_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
            return partName;
        }
        static GenerateTemplate(l, h) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "wall_" + l.toFixed(0) + "." + h.toFixed(0);
            template.angleSmoothSteps = 100;
            template.maxAngle = (0.8 * Math.PI) / 2;
            template.minTurnRadius = 0.12;
            template.l = l;
            template.minL = 3;
            template.h = h;
            template.minH = 3;
            template.yExtendable = true;
            template.lExtendableOnZ = true;
            let r = MarbleRunSimulatorCore.tileWidth;
            let rY = template.h * MarbleRunSimulatorCore.tileHeight * 0.45;
            let depthStart = 0;
            let depthEnd = MarbleRunSimulatorCore.tileSize * template.l;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileSize * 0.5, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90))];
            for (let n = 0; n <= 8; n++) {
                let f = n / 8;
                let cosa = Math.cos(2 * Math.PI * f);
                let sina = Math.sin(Math.PI * f);
                template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-(1 - sina) * r + r, (1 - cosa) * rY, Nabu.Easing.easeInOutSine(Nabu.Easing.easeInOutSine(f)) * (depthEnd - depthStart) + depthStart), undefined, n === 4 ? MarbleRunSimulatorCore.Tools.V3Dir(Math.PI) : undefined));
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileSize * 0.5, 0, depthEnd), MarbleRunSimulatorCore.Tools.V3Dir(-90)));
            let points = template.trackTemplates[0].trackpoints.map((tp) => {
                return tp.position.clone();
            });
            let f = 3;
            for (let n = 0; n < 1; n++) {
                let smoothedPoints = [...points].map((p) => {
                    return p.clone();
                });
                for (let i = 1; i < smoothedPoints.length - 1; i++) {
                    smoothedPoints[i]
                        .copyFrom(points[i - 1])
                        .addInPlace(points[i].scale(f))
                        .addInPlace(points[i + 1])
                        .scaleInPlace(1 / (2 + f));
                }
                points = smoothedPoints;
            }
            for (let i = 0; i < points.length; i++) {
                template.trackTemplates[0].trackpoints[i].position.copyFrom(points[i]);
            }
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.Wall = Wall;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Wave extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.setTemplate(this.machine.templateManager.getTemplate(Wave.PropToPartName(prop)));
            this.generateWires();
        }
        static PropToPartName(prop) {
            let partName = "wave_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
            return partName;
        }
        static GenerateTemplate(l, h, d) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "wave_" + l.toFixed(0) + "." + h.toFixed(0) + "." + d.toFixed(0);
            template.l = l;
            template.h = h;
            template.d = d;
            template.lExtendableOnX = true;
            template.hExtendableOnY = true;
            template.dExtendableOnZ = true;
            template.minH = -32;
            template.maxH = 32;
            template.minD = -32;
            template.maxD = 32;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            let start = new BABYLON.Vector3(-MarbleRunSimulatorCore.tileSize * 0.5, 0, 0);
            let end = new BABYLON.Vector3(MarbleRunSimulatorCore.tileSize * (template.l - 0.5), MarbleRunSimulatorCore.tileHeight * template.h, MarbleRunSimulatorCore.tileSize * template.d);
            let tanVector = dir.scale(BABYLON.Vector3.Distance(start, end));
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], start, dir, undefined, undefined, 1)];
            for (let i = 1; i < (l / 3 + 1); i++) {
                let p1 = BABYLON.Vector3.Hermite(start, tanVector, end, tanVector, i / (l / 3 + 1));
                if (i % 2 === 1) {
                    p1.y -= 0.008;
                }
                else {
                    p1.y += 0.008;
                }
                template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], p1));
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], end, dir, undefined, 1));
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.Wave = Wave;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class QuarterNote extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.notes = [];
            this.tings = [];
            this.noteMesh = [];
            let partName = "quarter";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            this.generateWires();
            let x = 1;
            if (prop.mirrorX) {
                x = -1;
            }
            let ting = BABYLON.MeshBuilder.CreateGround("ting", { width: 0.015, height: 0.06 });
            ting.position.x = -0.2 * MarbleRunSimulatorCore.tileWidth * x;
            ting.position.y = -0.015;
            ting.rotation.z = (Math.PI / 24) * x;
            ting.parent = this;
            this.tings.push(ting);
            let index = QuarterNote.index;
            QuarterNote.index++;
            if (QuarterNote.index >= QuarterNote.NoteNames.length) {
                QuarterNote.index = 0;
            }
            let note = new BABYLON.Sound("note_" + index, "./datas/sounds/notes/" + QuarterNote.NoteNames[index] + ".mp3", this.getScene(), undefined, { loop: false, autoplay: false });
            this.notes.push(note);
            let tile = BABYLON.MeshBuilder.CreateBox("tile", { width: 0.015, height: 0.005, depth: 0.06 });
            tile.material = this.game.materials.getMaterial(0, this.machine.materialQ);
            tile.position.copyFrom(ting.position);
            tile.rotation.copyFrom(ting.rotation);
            tile.parent = this;
            tile.computeWorldMatrix(true);
            tile.position.subtractInPlace(tile.up.scale(0.0026));
        }
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "quarter";
            template.h = 1;
            template.mirrorX = mirrorX;
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
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.3, 0 - 0.01, 0), MarbleRunSimulatorCore.Tools.V3Dir(130))];
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.1, -0.015, 0), MarbleRunSimulatorCore.Tools.V3Dir(70)), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.3, -MarbleRunSimulatorCore.tileHeight * template.h, 0), dir), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0), dir)];
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
            return template;
        }
    }
    QuarterNote.NoteNames = ["c3", "d3", "e3", "f3", "g3", "a4", "b4", "c4"];
    QuarterNote.index = 0;
    MarbleRunSimulatorCore.QuarterNote = QuarterNote;
    class DoubleNote extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.notes = [];
            this.tings = [];
            this.noteMesh = [];
            let partName = "double";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            this.generateWires();
            let x = 1;
            if (prop.mirrorX) {
                x = -1;
            }
            let ting = BABYLON.MeshBuilder.CreateGround("ting", { width: 0.015, height: 0.06 });
            ting.position.x = -0.2 * MarbleRunSimulatorCore.tileWidth * x;
            ting.position.y = -0.015;
            ting.rotation.z = (Math.PI / 9) * x;
            ting.parent = this;
            this.tings.push(ting);
            let index = QuarterNote.index;
            QuarterNote.index++;
            if (QuarterNote.index >= QuarterNote.NoteNames.length) {
                QuarterNote.index = 0;
            }
            let note = new BABYLON.Sound("note_" + index, "./datas/sounds/notes/" + QuarterNote.NoteNames[index] + ".mp3", this.getScene(), undefined, { loop: false, autoplay: false });
            this.notes.push(note);
            let tile = BABYLON.MeshBuilder.CreateBox("tile", { width: 0.015, height: 0.005, depth: 0.06 });
            tile.material = this.game.materials.getMaterial(0, this.machine.materialQ);
            tile.position.copyFrom(ting.position);
            tile.rotation.copyFrom(ting.rotation);
            tile.parent = this;
            tile.computeWorldMatrix(true);
            tile.position.subtractInPlace(tile.up.scale(0.0026));
            let ting2 = BABYLON.MeshBuilder.CreateGround("ting2", { width: 0.015, height: 0.06 });
            ting2.position.x = -0.05 * MarbleRunSimulatorCore.tileWidth * x;
            ting2.position.y = -0.001;
            ting2.rotation.z = (-Math.PI / 10) * x;
            ting2.parent = this;
            this.tings.push(ting2);
            index = QuarterNote.index;
            QuarterNote.index++;
            if (QuarterNote.index >= QuarterNote.NoteNames.length) {
                QuarterNote.index = 0;
            }
            let note2 = new BABYLON.Sound("note_" + index, "./datas/sounds/notes/" + QuarterNote.NoteNames[index] + ".mp3", this.getScene(), undefined, { loop: false, autoplay: false });
            this.notes.push(note2);
            let tile2 = BABYLON.MeshBuilder.CreateBox("tile2", { width: 0.015, height: 0.005, depth: 0.06 });
            tile2.material = this.game.materials.getMaterial(0, this.machine.materialQ);
            tile2.position.copyFrom(ting2.position);
            tile2.rotation.copyFrom(ting2.rotation);
            tile2.parent = this;
            tile2.computeWorldMatrix(true);
            tile2.position.subtractInPlace(tile2.up.scale(0.0026));
        }
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "double";
            template.h = 1;
            template.mirrorX = mirrorX;
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
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.3, 0 - 0.01, 0), MarbleRunSimulatorCore.Tools.V3Dir(130))];
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0, -MarbleRunSimulatorCore.tileHeight * template.h + 0.02, 0), MarbleRunSimulatorCore.Tools.V3Dir(110)), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0), dir)];
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.DoubleNote = DoubleNote;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Art extends BABYLON.Mesh {
        constructor(room, url, meshIndex = 0) {
            super("art");
            this.room = room;
            this.url = url;
            this.meshIndex = meshIndex;
            this.h = 0;
            this.layerMask = 0x10000000;
        }
        getAllMeshes() {
            return [
                this
            ];
        }
        async instantiate() {
            let vertexDatas = await this.room.game.vertexDataLoader.get(this.url);
            if (vertexDatas && vertexDatas[0]) {
                vertexDatas[this.meshIndex].applyToMesh(this);
            }
        }
        setLayerMask(mask) {
            this.layerMask = mask;
        }
    }
    MarbleRunSimulatorCore.Art = Art;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Painting extends BABYLON.Mesh {
        constructor(room, paintingName, size = 0.5) {
            super("painting-" + paintingName);
            this.room = room;
            this.paintingName = paintingName;
            this.size = size;
            this.h = 0;
            this._steelFrame = new BABYLON.Mesh("steel");
            this._steelFrame.layerMask = 0x10000000;
            this._steelFrame.parent = this;
            this._lightedPlane = new BABYLON.Mesh("lighted-plane");
            this._lightedPlane.layerMask = 0x10000000;
            this._lightedPlane.parent = this;
            this._paintBody = new BABYLON.Mesh("paint-body");
            this._paintBody.layerMask = 0x10000000;
            this._paintBody.position.y = 1.2;
            this._paintBody.parent = this;
            this._paintPlane = new BABYLON.Mesh("paint-plane");
            this._paintPlane.layerMask = 0x10000000;
            this._paintPlane.position.y = 1.2;
            this._paintPlane.position.z = 0.021;
            this._paintPlane.rotation.y = Math.PI;
            this._paintPlane.parent = this;
            this.layerMask = 0x10000000;
        }
        getAllMeshes() {
            return [
                this,
                this._steelFrame,
                this._lightedPlane,
                this._paintBody,
                this._paintPlane,
            ];
        }
        async instantiate() {
            let vertexDatas = await this.room.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/paint-support.babylon");
            if (vertexDatas && vertexDatas[0]) {
                vertexDatas[0].applyToMesh(this);
            }
            if (vertexDatas && vertexDatas[1]) {
                vertexDatas[1].applyToMesh(this._steelFrame);
                this._steelFrame.material = this.room.game.materials.getMaterial(0, this.room.machine.materialQ);
            }
            if (vertexDatas && vertexDatas[2]) {
                vertexDatas[2].applyToMesh(this._lightedPlane);
                this._lightedPlane.material = this.room.game.materials.paintingLight;
            }
            let texture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/" + this.paintingName + ".jpg");
            return new Promise((resolve) => {
                let checkTextureLoaded = () => {
                    if (texture.isReady()) {
                        let w = texture._texture.baseWidth;
                        let h = texture._texture.baseHeight;
                        let r = w / h;
                        let wMesh = this.size;
                        let hMesh = this.size;
                        if (r >= 1) {
                            hMesh /= r;
                        }
                        else {
                            wMesh *= r;
                        }
                        BABYLON.CreateBoxVertexData({ width: wMesh + 0.04, height: hMesh + 0.04, depth: 0.04 }).applyToMesh(this._paintBody);
                        BABYLON.CreatePlaneVertexData({ width: wMesh, height: hMesh }).applyToMesh(this._paintPlane);
                        let mat = new BABYLON.StandardMaterial(this.name + "-material");
                        mat.diffuseTexture = texture;
                        mat.emissiveColor = new BABYLON.Color3(0.25, 0.25, 0.25);
                        this._paintPlane.material = mat;
                        resolve();
                    }
                    else {
                        requestAnimationFrame(checkTextureLoaded);
                    }
                };
                checkTextureLoaded();
            });
        }
        setLayerMask(mask) {
            this.layerMask = mask;
            this.getChildMeshes().forEach(mesh => {
                mesh.layerMask = mask;
            });
        }
    }
    MarbleRunSimulatorCore.Painting = Painting;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class RoomProp {
    }
    MarbleRunSimulatorCore.RoomProp = RoomProp;
    class Room {
        constructor(machine, game) {
            this.machine = machine;
            this.game = game;
            this.decors = [];
            this._isBlurred = false;
            this._currentRoomIndex = 0;
            this.ground = new BABYLON.Mesh("room-ground");
            this.ground.layerMask = 0x10000000;
            this.ground.position.y = -2;
            this.ground.material = this.game.materials.wallShadow;
            this.wall = new BABYLON.Mesh("room-wall");
            this.wall.layerMask = 0x10000000;
            this.wall.material = this.game.materials.wallShadow;
            this.ceiling = new BABYLON.Mesh("room-ceiling");
            this.ceiling.layerMask = 0x10000000;
            this.ceiling.material = this.game.materials.wallShadow;
            this.frame = new BABYLON.Mesh("room-frame");
            this.frame.layerMask = 0x10000000;
            this.frame.material = this.game.materials.getMaterial(0, this.machine.materialQ);
            this.frame.parent = this.wall;
            this.light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 3, 0.5).normalize(), this.game.scene);
            this.light1.groundColor.copyFromFloats(0.3, 0.3, 0.3);
            this.light1.intensity = 0.6;
            this.light2 = new BABYLON.HemisphericLight("light2", new BABYLON.Vector3(-1, 3, -0.7).normalize(), this.game.scene);
            this.light2.groundColor.copyFromFloats(0.3, 0.3, 0.3);
            this.light2.intensity = 0.1;
            this.skybox = BABYLON.MeshBuilder.CreateSphere("room-skybox", { diameter: 20, sideOrientation: BABYLON.Mesh.BACKSIDE, segments: 4 }, this.game.scene);
            this.skybox.layerMask = 0x10000000;
            this.skyboxMaterial = new BABYLON.StandardMaterial("room-skybox-material", this.game.scene);
            this.skyboxMaterial.backFaceCulling = false;
            this.skyboxMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            this.skybox.material = this.skyboxMaterial;
            this.skybox.rotation.y = 0.16 * Math.PI;
        }
        get isBlurred() {
            return this._isBlurred;
        }
        set isBlurred(v) {
            this._isBlurred = v;
            let layerMask = 0x10000000;
            this.skybox.layerMask = layerMask;
            this.ground.layerMask = layerMask;
            this.wall.layerMask = layerMask;
            this.frame.layerMask = layerMask;
            this.ceiling.layerMask = layerMask;
            this.decors.forEach(decor => {
                decor.setLayerMask(layerMask);
            });
        }
        get currentRoomIndex() {
            return this._currentRoomIndex;
        }
        async setRoomIndex(roomIndex, forceAndskipAnimation) {
            if (forceAndskipAnimation || roomIndex != this._currentRoomIndex) {
                this._currentRoomIndex = roomIndex;
                if (!forceAndskipAnimation) {
                    await this.animateHide(1);
                }
                if (this._currentRoomIndex === 0) {
                    await this.instantiateMuseum(true, "./lib/marble-run-simulator-core/datas/skyboxes/city_night_low_res.png");
                }
                else if (this._currentRoomIndex === 1) {
                    let groundColor = BABYLON.Color4.FromHexString("#3F4C52FF");
                    let wallColor = BABYLON.Color4.FromHexString("#839099FF");
                    await this.instantiateSimple(groundColor, wallColor, 0);
                }
                else if (this._currentRoomIndex >= 2 && this._currentRoomIndex < 7) {
                    let f = (this._currentRoomIndex - 2) / 6;
                    let groundColor = BABYLON.Color3.FromHSV(Math.floor(f * 360), 0.3, 1);
                    let wallColor = BABYLON.Color3.FromHSV((Math.floor(f * 360) + 180) % 360, 0.3, 1);
                    console.log("GroundColor " + groundColor.toHexString());
                    console.log("WallColor " + wallColor.toHexString());
                    await this.instantiateSimple(groundColor.toColor4(), wallColor.toColor4(), this._currentRoomIndex % 2);
                }
                else if (this._currentRoomIndex === 7) {
                    await this.instantiateMuseum(false, "./lib/marble-run-simulator-core/datas/skyboxes/icescape_low_res.png");
                }
                else if (this._currentRoomIndex === 8) {
                    let groundColor = BABYLON.Color4.FromHexString("#3F4C52FF");
                    let wallColor = BABYLON.Color4.FromHexString("#839099FF");
                    await this.instantiateSimple(groundColor, wallColor, 1);
                }
                else if (this._currentRoomIndex === 9) {
                    await this.instantiateOpenRoom(true, "./lib/marble-run-simulator-core/datas/skyboxes/sky.jpeg");
                }
                else if (this._currentRoomIndex === 10) {
                    let groundColor = BABYLON.Color4.FromHexString("#FFFFFFFF");
                    let wallColor = BABYLON.Color4.FromHexString("#FFFFFFFF");
                    await this.instantiateSimple(groundColor, wallColor, 0);
                }
                else if (this._currentRoomIndex === 11) {
                    let groundColor = BABYLON.Color4.FromHexString("#FFFFFFFF");
                    let wallColor = BABYLON.Color4.FromHexString("#FFFFFFFF");
                    await this.instantiateSimple(groundColor, wallColor, 0);
                }
                else if (this._currentRoomIndex === 12) {
                    let groundColor = BABYLON.Color4.FromHexString("#000000FF");
                    let wallColor = BABYLON.Color4.FromHexString("#000000FF");
                    await this.instantiateSimple(groundColor, wallColor, 0);
                }
                if (this.onRoomJustInstantiated) {
                    this.onRoomJustInstantiated();
                }
                await this.animateShow(forceAndskipAnimation ? 0 : 1);
            }
        }
        contextualRoomIndex(index, q) {
            // 1 is the lite version of 0
            if (index === 0 && q === MarbleRunSimulatorCore.GraphicQuality.VeryLow) {
                return 1;
            }
            if (index === 1 && q > MarbleRunSimulatorCore.GraphicQuality.VeryLow) {
                return 0;
            }
            // 8 is the lite version of 7
            if (index === 7 && q === MarbleRunSimulatorCore.GraphicQuality.VeryLow) {
                return 8;
            }
            if (index === 8 && q > MarbleRunSimulatorCore.GraphicQuality.VeryLow) {
                return 7;
            }
            // 10 is the lite version of 9
            if (index === 9 && q === MarbleRunSimulatorCore.GraphicQuality.VeryLow) {
                return 10;
            }
            if (index === 10 && q > MarbleRunSimulatorCore.GraphicQuality.VeryLow) {
                return 9;
            }
            return index;
        }
        async instantiateSimple(groundColor, wallColor, wallPaperIndex) {
            this.decors.forEach(decor => {
                decor.dispose();
            });
            this.decors = [];
            this.frame.isVisible = false;
            let slice9Ground = Mummu.Create9SliceVertexData({ width: 10, height: 10, margin: 0.1, color: groundColor, uv1InWorldSpace: true });
            Mummu.RotateAngleAxisVertexDataInPlace(slice9Ground, Math.PI * 0.5, BABYLON.Axis.X);
            slice9Ground.applyToMesh(this.ground);
            this.ground.material = this.game.materials.whiteMaterial;
            let slice9Front = Mummu.Create9SliceVertexData({ width: 10, height: 3.2, margin: 0.1, color: wallColor });
            Mummu.TranslateVertexDataInPlace(slice9Front, new BABYLON.Vector3(0, 0, 5));
            let slice9Right = Mummu.Create9SliceVertexData({ width: 10, height: 3.2, margin: 0.1, color: wallColor });
            Mummu.RotateAngleAxisVertexDataInPlace(slice9Right, Math.PI * 0.5, BABYLON.Axis.Y);
            Mummu.TranslateVertexDataInPlace(slice9Right, new BABYLON.Vector3(5, 0, 0));
            let slice9Back = Mummu.Create9SliceVertexData({ width: 10, height: 3.2, margin: 0.1, color: wallColor });
            Mummu.RotateAngleAxisVertexDataInPlace(slice9Back, Math.PI, BABYLON.Axis.Y);
            Mummu.TranslateVertexDataInPlace(slice9Back, new BABYLON.Vector3(0, 0, -5));
            let slice9Left = Mummu.Create9SliceVertexData({ width: 10, height: 3.2, margin: 0.1, color: wallColor });
            Mummu.RotateAngleAxisVertexDataInPlace(slice9Left, -Math.PI * 0.5, BABYLON.Axis.Y);
            Mummu.TranslateVertexDataInPlace(slice9Left, new BABYLON.Vector3(-5, 0, 0));
            Mummu.MergeVertexDatas(slice9Front, slice9Right, slice9Back, slice9Left).applyToMesh(this.wall);
            this.wall.material = this.game.materials.wallShadow;
            let slice9Top = Mummu.Create9SliceVertexData({ width: 10, height: 10, margin: 0.2, color: wallColor });
            Mummu.RotateAngleAxisVertexDataInPlace(slice9Top, -Math.PI * 0.5, BABYLON.Axis.X);
            slice9Top.applyToMesh(this.ceiling);
            this.ceiling.material = this.game.materials.wallShadow;
            this.isBlurred = false;
            this.light1.intensity = 0.6;
            this.light2.intensity = 0.2;
            this.light1.includedOnlyMeshes = [this.ground, this.frame, this.ceiling, this.wall, this.skybox];
            this.light2.includedOnlyMeshes = [this.ground, this.frame, this.ceiling, this.wall, this.skybox];
            this.decors.forEach(decor => {
                this.light1.includedOnlyMeshes.push(...decor.getAllMeshes());
                this.light2.includedOnlyMeshes.push(...decor.getAllMeshes());
            });
            if (this.machine && this.machine.baseFrame) {
                this.light1.includedOnlyMeshes.push(this.machine.baseFrame);
                this.light2.includedOnlyMeshes.push(this.machine.baseFrame);
            }
            if (this.machine) {
                this.setGroundHeight(this.machine.baseMeshMinY - 0.8);
            }
        }
        async instantiateMuseum(useDecors, skyboxPath) {
            this.decors.forEach(decor => {
                decor.dispose();
            });
            this.decors = [];
            this.frame.isVisible = true;
            let skyTexture = new BABYLON.Texture(skyboxPath);
            this.skyboxMaterial.diffuseTexture = skyTexture;
            let vertexDatas = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/room.babylon");
            vertexDatas[0].applyToMesh(this.ground);
            this.ground.receiveShadows = true;
            this.ground.material = this.game.materials.groundMaterial;
            vertexDatas[1].applyToMesh(this.wall);
            this.wall.material = this.game.materials.whiteMaterial;
            vertexDatas[2].applyToMesh(this.frame);
            this.frame.parent = this.wall;
            this.frame.material = this.game.materials.getMaterial(0, this.machine.materialQ);
            let slice9Top = Mummu.Create9SliceVertexData({ width: 10, height: 10, margin: 0.05 });
            Mummu.RotateAngleAxisVertexDataInPlace(slice9Top, -Math.PI * 0.5, BABYLON.Axis.X);
            slice9Top.applyToMesh(this.ceiling);
            this.ceiling.material = this.game.materials.whiteMaterial;
            let paintingNames = ["bilbao_1", "bilbao_2", "bilbao_3", "flower_1", "flower_2", "flower_3", "flower_4", "fort_william_1", "glasgow_1"];
            let n = 0;
            let randomPainting = () => {
                return paintingNames[n++];
            };
            if (useDecors) {
                let paint1 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
                await paint1.instantiate();
                paint1.position.copyFromFloats(4, 0, 4);
                paint1.rotation.y = -0.75 * Math.PI;
                this.decors.push(paint1);
                let paint11 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
                await paint11.instantiate();
                paint11.position.copyFromFloats(2.8, 0, 4.5);
                paint11.rotation.y = -Math.PI;
                this.decors.push(paint11);
                let paint2 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
                await paint2.instantiate();
                paint2.position.copyFromFloats(4, 0, -4);
                paint2.rotation.y = -0.25 * Math.PI;
                this.decors.push(paint2);
                let paint21 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
                await paint21.instantiate();
                paint21.position.copyFromFloats(2.8, 0, -4.5);
                this.decors.push(paint21);
                let paint3 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
                await paint3.instantiate();
                paint3.position.copyFromFloats(-4, 0, -4);
                paint3.rotation.y = 0.25 * Math.PI;
                this.decors.push(paint3);
                let paint31 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
                await paint31.instantiate();
                paint31.position.copyFromFloats(-4.5, 0, -2.8);
                paint31.rotation.y = 0.5 * Math.PI;
                this.decors.push(paint31);
                let paint32 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
                await paint32.instantiate();
                paint32.position.copyFromFloats(-2.8, 0, -4.5);
                this.decors.push(paint32);
                let paint4 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
                await paint4.instantiate();
                paint4.position.copyFromFloats(-4, 0, 4);
                paint4.rotation.y = 0.75 * Math.PI;
                this.decors.push(paint4);
                let paint41 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
                await paint41.instantiate();
                paint41.position.copyFromFloats(-2.8, 0, 4.5);
                paint41.rotation.y = Math.PI;
                this.decors.push(paint41);
                let sculpt1 = new MarbleRunSimulatorCore.Sculpt(this, this.game.materials.getMaterial(0, this.machine.materialQ));
                await sculpt1.instantiate();
                sculpt1.position.copyFromFloats(4.5, 0, 0);
                sculpt1.rotation.y = -0.5 * Math.PI;
                this.decors.push(sculpt1);
                let sculpt2 = new MarbleRunSimulatorCore.Sculpt(this, this.game.materials.getMaterial(1, this.machine.materialQ));
                await sculpt2.instantiate();
                sculpt2.position.copyFromFloats(-4.5, 0, 0);
                sculpt2.rotation.y = 0.5 * Math.PI;
                this.decors.push(sculpt2);
            }
            this.isBlurred = true;
            this.light1.intensity = 0.2;
            this.light2.intensity = 0.2;
            this.light1.includedOnlyMeshes = [this.ground, this.frame, this.ceiling, this.wall, this.skybox];
            this.light2.includedOnlyMeshes = [this.ground, this.frame, this.ceiling, this.wall, this.skybox];
            this.decors.forEach(decor => {
                this.light1.includedOnlyMeshes.push(...decor.getAllMeshes());
                this.light2.includedOnlyMeshes.push(...decor.getAllMeshes());
            });
            if (this.machine && this.machine.baseFrame) {
                this.light1.includedOnlyMeshes.push(this.machine.baseFrame);
                this.light2.includedOnlyMeshes.push(this.machine.baseFrame);
            }
            if (this.machine) {
                this.setGroundHeight(this.machine.baseMeshMinY - 0.8);
            }
        }
        async instantiateOpenRoom(useDecors, skyboxPath) {
            this.decors.forEach(decor => {
                decor.dispose();
            });
            this.decors = [];
            this.frame.isVisible = true;
            let skyTexture = new BABYLON.Texture(skyboxPath);
            this.skyboxMaterial.diffuseTexture = skyTexture;
            this.skyboxMaterial.emissiveTexture = skyTexture;
            let vertexDatas = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/open-room.babylon");
            vertexDatas[0].applyToMesh(this.ground);
            this.ground.receiveShadows = false;
            this.ground.material = this.game.materials.whiteGroundMaterial;
            vertexDatas[1].applyToMesh(this.wall);
            this.wall.material = this.game.materials.whiteMaterial;
            vertexDatas[2].applyToMesh(this.frame);
            this.frame.parent = this.ground;
            this.frame.material = this.game.materials.whiteMaterial;
            vertexDatas[3].applyToMesh(this.ceiling);
            this.ceiling.material = this.game.materials.whiteMaterial;
            if (useDecors) {
                let art1 = new MarbleRunSimulatorCore.Art(this, "./lib/marble-run-simulator-core/datas/meshes/arts.babylon", 0);
                await art1.instantiate();
                art1.position.copyFromFloats(3.5, 0, 3.5);
                this.decors.push(art1);
                let art2 = new MarbleRunSimulatorCore.Art(this, "./lib/marble-run-simulator-core/datas/meshes/arts.babylon", 1);
                art2.h = 0.2;
                await art2.instantiate();
                art2.position.copyFromFloats(-4, 0, 3.5);
                this.decors.push(art2);
                let art3 = new MarbleRunSimulatorCore.Art(this, "./lib/marble-run-simulator-core/datas/meshes/arts.babylon", 0);
                art3.h = 0.2;
                await art3.instantiate();
                art3.position.copyFromFloats(-4, 0, -3.5);
                this.decors.push(art3);
                let art4 = new MarbleRunSimulatorCore.Art(this, "./lib/marble-run-simulator-core/datas/meshes/arts.babylon", 1);
                art4.h = -0.2;
                await art4.instantiate();
                art4.position.copyFromFloats(4, 0, -4.2);
                this.decors.push(art4);
            }
            this.isBlurred = true;
            this.light1.intensity = 0.8;
            this.light2.intensity = 0;
            this.light1.includedOnlyMeshes = [this.ground, this.frame, this.ceiling, this.wall, this.skybox];
            this.light2.includedOnlyMeshes = [this.ground, this.frame, this.ceiling, this.wall, this.skybox];
            this.decors.forEach(decor => {
                this.light1.includedOnlyMeshes.push(...decor.getAllMeshes());
                this.light2.includedOnlyMeshes.push(...decor.getAllMeshes());
            });
            if (this.machine && this.machine.baseFrame) {
                this.light1.includedOnlyMeshes.push(this.machine.baseFrame);
                this.light2.includedOnlyMeshes.push(this.machine.baseFrame);
            }
            if (this.machine) {
                this.setGroundHeight(this.machine.baseMeshMinY - 0.8);
            }
        }
        async animateShow(duration = 1) {
            return new Promise((resolve) => {
                let t0 = performance.now();
                let step = () => {
                    let t = performance.now();
                    let dt = (t - t0) / 1000;
                    if (dt >= duration) {
                        this.decors.forEach(decor => {
                            decor.position.y = this.ground.position.y + decor.h;
                            decor.scaling.copyFromFloats(1, 1, 1);
                        });
                        this.skyboxMaterial.diffuseColor.copyFromFloats(1, 1, 1);
                        this.skyboxMaterial.emissiveColor.copyFromFloats(0.3, 0.3, 0.3);
                        this.ground.rotation.y = 0;
                        this.ground.scaling.copyFromFloats(1, 1, 1);
                        this.wall.rotation.y = 0;
                        this.wall.scaling.copyFromFloats(1, 1, 1);
                        this.ceiling.rotation.y = 0;
                        this.ceiling.scaling.copyFromFloats(1, 1, 1);
                        resolve();
                    }
                    else {
                        let f = dt / duration;
                        f = Nabu.Easing.easeOutCubic(f);
                        this.decors.forEach(decor => {
                            decor.position.y = this.ground.position.y + decor.h - 2 * (1 - f);
                            decor.scaling.copyFromFloats(f, f, f);
                        });
                        this.skyboxMaterial.diffuseColor.copyFromFloats(f, f, f);
                        this.skyboxMaterial.emissiveColor.copyFromFloats(0.3 * f, 0.3 * f, 0.3 * f);
                        this.ground.rotation.y = -0.5 * Math.PI * (1 - f);
                        this.ground.scaling.copyFromFloats(f, f, f);
                        this.wall.rotation.y = 0.5 * Math.PI * (1 - f);
                        this.wall.scaling.copyFromFloats(4 - 3 * f, f, 4 - 3 * f);
                        this.ceiling.rotation.y = -0.5 * Math.PI * (1 - f);
                        this.ceiling.scaling.copyFromFloats(f, f, f);
                        requestAnimationFrame(step);
                    }
                };
                step();
            });
        }
        async animateHide(duration = 1) {
            return new Promise((resolve) => {
                let t0 = performance.now();
                let step = () => {
                    let t = performance.now();
                    let dt = (t - t0) / 1000;
                    if (dt >= duration) {
                        this.decors.forEach(decor => {
                            decor.position.y = this.ground.position.y + decor.h - 2;
                            decor.scaling.copyFromFloats(0, 0, 0);
                        });
                        this.skyboxMaterial.diffuseColor.copyFromFloats(0, 0, 0);
                        this.skyboxMaterial.emissiveColor.copyFromFloats(0, 0, 0);
                        this.ground.rotation.y = -0.5 * Math.PI;
                        this.ground.scaling.copyFromFloats(0, 0, 0);
                        this.wall.rotation.y = 0.5 * Math.PI;
                        this.wall.scaling.copyFromFloats(4, 0, 4);
                        this.ceiling.rotation.y = -0.5 * Math.PI;
                        this.ceiling.scaling.copyFromFloats(0, 0, 0);
                        resolve();
                    }
                    else {
                        let f = dt / duration;
                        f = Nabu.Easing.easeInCubic(f);
                        this.decors.forEach(decor => {
                            decor.position.y = this.ground.position.y + decor.h - 2 * f;
                            decor.scaling.copyFromFloats(1 - f, 1 - f, 1 - f);
                        });
                        this.skyboxMaterial.diffuseColor.copyFromFloats(1 - f, 1 - f, 1 - f);
                        this.skyboxMaterial.emissiveColor.copyFromFloats(0.3 * (1 - f), 0.3 * (1 - f), 0.3 * (1 - f));
                        this.ground.rotation.y = -0.5 * Math.PI * f;
                        this.ground.scaling.copyFromFloats(1 - f, 1 - f, 1 - f);
                        this.wall.rotation.y = 0.5 * Math.PI * (f - 1);
                        this.wall.scaling.copyFromFloats(1 + f, 1 - f, 1 + f);
                        this.ceiling.rotation.y = -0.5 * Math.PI * f;
                        this.ceiling.scaling.copyFromFloats(1 - f, 1 - f, 1 - f);
                        requestAnimationFrame(step);
                    }
                };
                step();
            });
        }
        setGroundHeight(h) {
            if (this.ground) {
                this.ground.position.y = h;
                this.wall.position.y = this.ground.position.y + 1.6;
                this.ceiling.position.y = this.ground.position.y + 3.2;
                this.decors.forEach(decor => {
                    decor.position.y = this.ground.position.y + decor.h;
                });
            }
        }
        dispose() {
            this.ground.dispose();
            this.frame.dispose();
            this.wall.dispose();
            this.light1.dispose();
            this.light2.dispose();
        }
    }
    MarbleRunSimulatorCore.Room = Room;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Sculpt extends BABYLON.Mesh {
        constructor(room, mat) {
            super("sculpt");
            this.room = room;
            this.mat = mat;
            this.h = 0;
            this.layerMask = 0x10000000;
        }
        getAllMeshes() {
            return [
                this,
                this._steel
            ];
        }
        async instantiate() {
            let vertexDatas = await this.room.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/museum-stand-decoy.babylon");
            if (vertexDatas && vertexDatas[0]) {
                vertexDatas[0].applyToMesh(this);
            }
            if (vertexDatas && vertexDatas[1]) {
                this._steel = new BABYLON.Mesh("steel");
                vertexDatas[1].applyToMesh(this._steel);
                this._steel.parent = this;
                this._steel.material = this.mat;
                this._steel.layerMask = 0x10000000;
            }
        }
        setLayerMask(mask) {
            this.layerMask = mask;
            this.getChildMeshes().forEach(mesh => {
                mesh.layerMask = mask;
            });
        }
    }
    MarbleRunSimulatorCore.Sculpt = Sculpt;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
