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
    })(Surface = MarbleRunSimulatorCore.Surface || (MarbleRunSimulatorCore.Surface = {}));
    class Ball extends BABYLON.Mesh {
        constructor(positionZero, machine, _materialIndex = 0) {
            super("ball");
            this.positionZero = positionZero;
            this.machine = machine;
            this._materialIndex = _materialIndex;
            this.constructorIndex = 0;
            this.size = 0.016;
            this.velocity = BABYLON.Vector3.Zero();
            this.rotationSpeed = 0;
            this.rotationAxis = BABYLON.Vector3.Right();
            this.surface = Surface.Rail;
            this._showPositionZeroGhost = false;
            this.bumpSurfaceIsRail = true;
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
            this.constructorIndex = Ball.ConstructorIndex++;
            this.marbleChocSound = new BABYLON.Sound("marble-choc-sound", "./datas/sounds/marble-choc.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.railBumpSound = new BABYLON.Sound("rail-bump-sound", "./datas/sounds/rail-bump.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.marbleLoopSound = new BABYLON.Sound("marble-loop-sound", "./datas/sounds/marble-loop.wav", this.getScene(), undefined, { loop: true, autoplay: true });
            this.marbleLoopSound.setVolume(0);
            this.marbleBowlLoopSound = new BABYLON.Sound("marble-bowl-loop-sound", "./datas/sounds/marble-bowl-loop.wav", this.getScene(), undefined, { loop: true, autoplay: true });
            this.marbleBowlLoopSound.setVolume(0);
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
            this.material = this.game.materials.getBallMaterial(this.materialIndex);
        }
        setPositionZero(p) {
            this.positionZero.copyFrom(p);
            this.positionZeroGhost.position.copyFrom(p);
        }
        get k() {
            return -Math.round(this.positionZero.z / MarbleRunSimulatorCore.tileDepth);
        }
        set k(v) {
            this.positionZero.z = -Math.round(v) * MarbleRunSimulatorCore.tileDepth;
            this.positionZeroGhost.position.copyFrom(this.positionZero);
        }
        select() {
            this.selectedMesh.isVisible = true;
        }
        unselect() {
            this.selectedMesh.isVisible = false;
        }
        setIsVisible(isVisible) {
            this.isVisible = isVisible;
            this.getChildMeshes().forEach((m) => {
                m.isVisible = isVisible;
            });
        }
        async instantiate() {
            this.marbleLoopSound.setVolume(0);
            this.marbleBowlLoopSound.setVolume(0);
            let data = BABYLON.CreateSphereVertexData({ diameter: this.size });
            let uvs = data.uvs;
            for (let i = 0; i < uvs.length / 2; i++) {
                uvs[2 * i] *= -2;
            }
            data.applyToMesh(this);
            this.material = this.game.materials.getBallMaterial(this.materialIndex);
            if (this.positionZeroGhost) {
                this.positionZeroGhost.dispose();
            }
            this.positionZeroGhost = new BallGhost(this);
            BABYLON.CreateSphereVertexData({ diameter: this.size * 0.95 }).applyToMesh(this.positionZeroGhost);
            this.positionZeroGhost.material = this.game.materials.ghostMaterial;
            this.positionZeroGhost.position.copyFrom(this.positionZero);
            this.positionZeroGhost.isVisible = this._showPositionZeroGhost;
            if (this.selectedMesh) {
                this.selectedMesh.dispose();
            }
            let points = [];
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
            this.reset();
        }
        dispose(doNotRecurse, disposeMaterialAndTextures) {
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
        reset() {
            this.position.copyFrom(this.positionZero);
            if (this.rotationQuaternion) {
                this.rotationQuaternion.copyFromFloats(0, 0, 0, 1);
            }
            this.velocity.copyFromFloats(0, 0, 0);
            this._timer = 0;
            this.marbleLoopSound.setVolume(0, 0.1);
            this.marbleBowlLoopSound.setVolume(0, 0.1);
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
        update(dt) {
            let sign = Math.sign(this.velocity.y);
            if (this.position.y < this.machine.baseMeshMinY - 0.2) {
                if (this.game.mode === MarbleRunSimulatorCore.GameMode.Challenge) {
                    if (this.machine.playing) {
                        this.machine.stop();
                    }
                }
                return;
            }
            this._timer += dt * this.game.currentTimeFactor;
            this._timer = Math.min(this._timer, 1);
            while (this._timer > 0) {
                let m = this.mass;
                let dt = this.game.physicDT;
                let f = this.velocity.length();
                f = Math.max(Math.min(f, 1), 0.4);
                this._timer -= dt / f;
                let weight = new BABYLON.Vector3(0, -9 * m, 0);
                let reactions = BABYLON.Vector3.Zero();
                let reactionsCount = 0;
                let forcedDisplacement = BABYLON.Vector3.Zero();
                let canceledSpeed = BABYLON.Vector3.Zero();
                this.bumpSurfaceIsRail = true;
                this.machine.parts.forEach((part) => {
                    if (Mummu.SphereAABBCheck(this.position, this.radius, part.AABBMin.x - this.radius, part.AABBMax.x + this.radius, part.AABBMin.y - this.radius, part.AABBMax.y + this.radius, part.AABBMin.z - this.radius, part.AABBMax.z + this.radius)) {
                        part.allWires.forEach((wire) => {
                            let index = this.getLastIndex(wire);
                            let col;
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
                            col = Mummu.SphereWireIntersection(this.position, this.radius, wire.absolutePath, wire.size * 0.5, !(part instanceof MarbleRunSimulatorCore.Spiral), index, range);
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
                                if (part instanceof MarbleRunSimulatorCore.Elevator) {
                                    this.position.z = part.absolutePosition.z;
                                    this.velocity.z = 0;
                                }
                            }
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
                            part.boxes.forEach((box) => {
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
                        if (part instanceof MarbleRunSimulatorCore.Controler) {
                            let col = Mummu.SphereMeshIntersection(this.position, this.radius, part.pivotControlerCollider);
                            if (col.hit) {
                                // Move away from collision
                                forcedDisplacement.addInPlace(col.normal.scale(col.depth));
                                if (this.velocity.length() > 0.5) {
                                    this.velocity.scaleInPlace(0.9);
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
                this.machine.balls.forEach((ball) => {
                    if (ball != this) {
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
                            this.railBumpSound.play();
                        }
                    }
                    else {
                        if (!this.marbleChocSound.isPlaying) {
                            this.marbleChocSound.setVolume(v * 4);
                            this.marbleChocSound.play();
                        }
                    }
                }
                this.strReaction = this.strReaction * 0.98;
                this.strReaction += reactions.length() * 0.02;
                this.velocity.subtractInPlace(canceledSpeed);
                //this.velocity.addInPlace(forcedDisplacement.scale(0.1 * 1 / dt));
                this.position.addInPlace(forcedDisplacement);
                let friction = this.velocity.scale(-1).scaleInPlace(0.001);
                let acceleration = weight
                    .add(reactions)
                    .add(friction)
                    .scaleInPlace(1 / m);
                this.velocity.addInPlace(acceleration.scale(dt));
                this.position.addInPlace(this.velocity.scale(dt));
                if (this.lastPosition) {
                    this.visibleVelocity.copyFrom(this.position).subtractInPlace(this.lastPosition).scaleInPlace(1 / dt);
                    if (this.visibleVelocity.lengthSquared() > 1) {
                        this.visibleVelocity.normalize();
                    }
                }
                this.lastPosition.copyFrom(this.position);
                if (reactions.length() > 0) {
                    BABYLON.Vector3.CrossToRef(reactions, this.visibleVelocity, this.rotationAxis).normalize();
                    this.rotationSpeed = this.visibleVelocity.length() / (2 * Math.PI * this.radius);
                    if (reactionsCount > 2) {
                        this.rotationSpeed /= 3;
                    }
                }
                this.rotate(this.rotationAxis, this.rotationSpeed * 2 * Math.PI * dt, BABYLON.Space.WORLD);
            }
            let f = Nabu.MinMax((this.velocity.length() - 0.1) / 0.9, 0, 1);
            if (this.surface === Surface.Rail) {
                this.marbleLoopSound.setVolume(4 * this.strReaction * f * this.game.timeFactor * this.game.mainVolume);
                this.marbleBowlLoopSound.setVolume(0, 0.5);
            }
            else if (this.surface === Surface.Bowl) {
                this.marbleBowlLoopSound.setVolume(10 * this.strReaction * f * this.game.timeFactor * this.game.mainVolume);
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
    class MainMaterials {
        constructor(game) {
            this.game = game;
            this.metalMaterials = [];
            this.ballMaterials = [];
            let envTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./lib/marble-run-simulator-core/datas/environment/environmentSpecular.env", this.game.scene);
            this.handleMaterial = new BABYLON.StandardMaterial("handle-material");
            this.handleMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.handleMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.handleMaterial.alpha = 1;
            this.ghostMaterial = new BABYLON.StandardMaterial("ghost-material");
            this.ghostMaterial.diffuseColor.copyFromFloats(0.8, 0.8, 1);
            this.ghostMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.ghostMaterial.alpha = 0.3;
            this.gridMaterial = new BABYLON.StandardMaterial("grid-material");
            this.gridMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.gridMaterial.specularColor.copyFromFloats(0, 0, 0);
            //this.gridMaterial.alpha = this.game.config.getValue("gridOpacity");
            this.cyanMaterial = new BABYLON.StandardMaterial("cyan-material");
            this.cyanMaterial.diffuseColor = BABYLON.Color3.FromHexString("#00FFFF");
            this.cyanMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.redMaterial = new BABYLON.StandardMaterial("red-material");
            this.redMaterial.diffuseColor = BABYLON.Color3.FromHexString("#bf212f");
            this.redMaterial.emissiveColor = BABYLON.Color3.FromHexString("#bf212f");
            this.redMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.greenMaterial = new BABYLON.StandardMaterial("green-material");
            this.greenMaterial.diffuseColor = BABYLON.Color3.FromHexString("#006f3c");
            this.greenMaterial.emissiveColor = BABYLON.Color3.FromHexString("#006f3c");
            this.greenMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.blueMaterial = new BABYLON.StandardMaterial("blue-material");
            this.blueMaterial.diffuseColor = BABYLON.Color3.FromHexString("#264b96");
            this.blueMaterial.emissiveColor = BABYLON.Color3.FromHexString("#264b96");
            this.blueMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.whiteAutolitMaterial = new BABYLON.StandardMaterial("white-autolit-material");
            this.whiteAutolitMaterial.diffuseColor = BABYLON.Color3.FromHexString("#baccc8");
            this.whiteAutolitMaterial.emissiveColor = BABYLON.Color3.FromHexString("#baccc8").scaleInPlace(0.5);
            this.whiteAutolitMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.whiteFullLitMaterial = new BABYLON.StandardMaterial("white-autolit-material");
            this.whiteFullLitMaterial.diffuseColor = BABYLON.Color3.FromHexString("#baccc8");
            this.whiteFullLitMaterial.emissiveColor = BABYLON.Color3.FromHexString("#baccc8");
            this.whiteFullLitMaterial.specularColor.copyFromFloats(0, 0, 0);
            let steelMaterial = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            steelMaterial.baseColor = new BABYLON.Color3(0.5, 0.75, 1.0);
            steelMaterial.metallic = 1.0;
            steelMaterial.roughness = 0.15;
            steelMaterial.environmentTexture = envTexture;
            let copperMaterial = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            copperMaterial.baseColor = BABYLON.Color3.FromHexString("#B87333");
            copperMaterial.metallic = 1.0;
            copperMaterial.roughness = 0.15;
            copperMaterial.environmentTexture = envTexture;
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
            this.metalMaterials = [steelMaterial, copperMaterial, plasticIndigo, plasticRed, plasticOrange, plasticYellow, plasticGreen];
            this.velvetMaterial = new BABYLON.StandardMaterial("velvet-material");
            this.velvetMaterial.diffuseColor.copyFromFloats(0.75, 0.75, 0.75);
            this.velvetMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/velvet.jpg");
            this.velvetMaterial.specularColor.copyFromFloats(0, 0, 0);
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
            this.leatherMaterial = new BABYLON.StandardMaterial("leather-material");
            this.leatherMaterial.diffuseColor.copyFromFloats(0.05, 0.02, 0.02);
            this.leatherMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.whiteMaterial = new BABYLON.StandardMaterial("white-material");
            this.whiteMaterial.diffuseColor.copyFromFloats(0.9, 0.95, 1).scaleInPlace(0.9);
            this.whiteMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.paintingLight = new BABYLON.StandardMaterial("autolit-material");
            this.paintingLight.diffuseColor.copyFromFloats(1, 1, 1);
            this.paintingLight.emissiveTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/painting-light.png");
            this.paintingLight.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            let makeMetalBallMaterial = (name, textureName) => {
                let ballMaterial = new BABYLON.PBRMetallicRoughnessMaterial(name, this.game.scene);
                ballMaterial.metallic = 1;
                ballMaterial.roughness = 0.15;
                ballMaterial.environmentTexture = envTexture;
                ballMaterial.baseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/" + textureName, undefined, undefined, false);
                return ballMaterial;
            };
            let makeBrandedBallMaterial = (name, textureName) => {
                let ballMaterial = new BABYLON.PBRMetallicRoughnessMaterial(name, this.game.scene);
                ballMaterial.baseColor = BABYLON.Color3.FromHexString("#FFFFFF");
                ballMaterial.metallic = 0.7;
                ballMaterial.roughness = 0.3;
                ballMaterial.environmentTexture = envTexture;
                ballMaterial.baseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/" + textureName, undefined, undefined, false);
                return ballMaterial;
            };
            this.ballMaterials = [
                this.metalMaterials[0],
                this.metalMaterials[1],
                makeBrandedBallMaterial("square-red", "ball-square-red.png"),
                makeBrandedBallMaterial("circle-green", "ball-circle-green.png"),
                makeBrandedBallMaterial("star-blue", "ball-star-blue.png"),
                makeBrandedBallMaterial("tiaratum", "ball-tiaratum.png"),
                makeBrandedBallMaterial("html5", "ball-html5.png"),
                makeBrandedBallMaterial("tiaratum", "ball-bjs.png"),
                makeBrandedBallMaterial("html5", "ball-poki.png")
            ];
        }
        getMetalMaterial(colorIndex) {
            return this.metalMaterials[colorIndex % this.metalMaterials.length];
        }
        getBallMaterial(colorIndex) {
            return this.ballMaterials[colorIndex % this.ballMaterials.length];
        }
    }
    MarbleRunSimulatorCore.MainMaterials = MainMaterials;
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
    }
    MarbleRunSimulatorCore.Tools = Tools;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Wire extends BABYLON.Mesh {
        constructor(track) {
            super("wire");
            this.track = track;
            this.path = [];
            this.normals = [];
            this.absolutePath = [];
            this.parent = this.track;
            this.rotationQuaternion = BABYLON.Quaternion.Identity();
            Wire.Instances.push(this);
        }
        get size() {
            if (isFinite(this.wireSize)) {
                return this.wireSize;
            }
            return this.track.wireSize;
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
            let q = this.track.game.getGraphicQ();
            while (this.getChildren().length > 0) {
                this.getChildren()[0].dispose();
            }
            let n = 4;
            if (q === 1) {
                n = 6;
            }
            else if (q === 2) {
                n = 8;
            }
            let shape = [];
            for (let i = 0; i < n; i++) {
                let a = (i / n) * 2 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                shape[i] = new BABYLON.Vector3(cosa * this.radius, sina * this.radius, 0);
            }
            if (!Wire.DEBUG_DISPLAY) {
                let path = this.path;
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
                        .normalize()
                        .scaleInPlace(-1)
                        .scaleInPlace(this.track.wireGauge * 0.5);
                    Mummu.RotateInPlace(d, this.startTipNormal, -Math.PI / 2);
                    let tipPath = [d.add(this.startTipCenter)];
                    for (let i = 0; i < 8 - 1; i++) {
                        Mummu.RotateInPlace(d, this.startTipNormal, Math.PI / 8);
                        tipPath.push(d.add(this.startTipCenter));
                    }
                    path = [...tipPath, ...path];
                }
                if (this.endTipDir) {
                    let d = this.endTipDir.normalize().scaleInPlace(this.track.wireGauge * 0.5);
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
                wire.material = this.track.game.materials.getMetalMaterial(color);
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
    Wire.Instances = new Nabu.UniqueList();
    MarbleRunSimulatorCore.Wire = Wire;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
/// <reference path="../../../babylon.d.ts"/>
/// <reference path="../../../nabu/nabu.d.ts"/>
/// <reference path="../../../mummu/mummu.d.ts"/>
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    function NToHex(n, l = 2) {
        return n.toString(36).padStart(l, "0").substring(0, l);
    }
    var ballOffset = 23328; // it's 36 * 36 * 36 / 2
    var partOffset = 648; // it's 36 * 36 / 2
    let GameMode;
    (function (GameMode) {
        GameMode[GameMode["Home"] = 0] = "Home";
        GameMode[GameMode["Page"] = 1] = "Page";
        GameMode[GameMode["Create"] = 2] = "Create";
        GameMode[GameMode["Challenge"] = 3] = "Challenge";
        GameMode[GameMode["Demo"] = 4] = "Demo";
    })(GameMode = MarbleRunSimulatorCore.GameMode || (MarbleRunSimulatorCore.GameMode = {}));
    class Machine {
        constructor(game) {
            this.game = game;
            this.name = "Unnamed Machine";
            this.author = "Unknown Author";
            this.parts = [];
            this.balls = [];
            this.instantiated = false;
            this.playing = false;
            this.onStopCallbacks = new Nabu.UniqueList();
            this.margin = 0.05;
            this.baseMeshMinX = -this.margin;
            this.baseMeshMaxX = this.margin;
            this.baseMeshMinY = -this.margin;
            this.baseMeshMaxY = this.margin;
            this.baseMeshMinZ = -this.margin;
            this.baseMeshMaxZ = this.margin;
            this.requestUpdateShadow = false;
            this.name = MachineName.GetRandom();
            this.trackFactory = new MarbleRunSimulatorCore.MachinePartFactory(this);
            this.templateManager = new MarbleRunSimulatorCore.TemplateManager(this);
        }
        setAllIsSelectable(isSelectable) {
            for (let i = 0; i < this.parts.length; i++) {
                this.parts[i].isSelectable = isSelectable;
            }
        }
        async instantiate() {
            this.sleeperVertexData = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/sleepers.babylon");
            this.parts = this.parts.sort((a, b) => {
                return b.j + b.h - (a.j + a.h);
            });
            for (let i = 0; i < this.parts.length; i++) {
                await this.parts[i].instantiate();
                this.parts[i].isPlaced = true;
                await Nabu.Wait(2);
            }
            for (let i = 0; i < this.balls.length; i++) {
                await this.balls[i].instantiate();
            }
            return new Promise((resolve) => {
                requestAnimationFrame(() => {
                    for (let i = 0; i < this.parts.length; i++) {
                        this.parts[i].recomputeAbsolutePath();
                    }
                    this.instantiated = true;
                    resolve();
                });
            });
        }
        dispose() {
            while (this.balls.length > 0) {
                this.balls[0].dispose();
            }
            while (this.parts.length > 0) {
                this.parts[0].dispose();
            }
            this.instantiated = false;
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
                    p: ball.position,
                    v: ball.velocity
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
                ball.position = save.balls[i].p;
                ball.velocity = save.balls[i].v;
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
            if (this.requestUpdateShadow) {
                this.updateShadow();
            }
            if (this.playing) {
                let dt = this.game.scene.deltaTime / 1000;
                if (isFinite(dt)) {
                    for (let i = 0; i < this.balls.length; i++) {
                        this.balls[i].update(dt);
                    }
                    for (let i = 0; i < this.parts.length; i++) {
                        this.parts[i].update(dt);
                    }
                }
            }
            else {
                for (let i = 0; i < this.balls.length; i++) {
                    this.balls[i].marbleLoopSound.setVolume(0, 0.1);
                    this.balls[i].marbleBowlLoopSound.setVolume(0, 0.1);
                }
            }
        }
        play() {
            this.playing = true;
        }
        stop() {
            for (let i = 0; i < this.balls.length; i++) {
                this.balls[i].reset();
            }
            this.onStopCallbacks.forEach((callback) => {
                callback();
            });
            this.playing = false;
        }
        async generateBaseMesh() {
            let previousBaseMinY = this.baseMeshMinY;
            this.baseMeshMinX = -this.margin;
            this.baseMeshMaxX = this.margin;
            this.baseMeshMinY = -this.margin;
            this.baseMeshMaxY = this.margin;
            this.baseMeshMinZ = -this.margin;
            this.baseMeshMaxZ = this.margin;
            for (let i = 0; i < this.parts.length; i++) {
                let track = this.parts[i];
                this.baseMeshMinX = Math.min(this.baseMeshMinX, track.position.x - MarbleRunSimulatorCore.tileWidth * 0.5);
                this.baseMeshMaxX = Math.max(this.baseMeshMaxX, track.position.x + MarbleRunSimulatorCore.tileWidth * (track.w - 0.5));
                this.baseMeshMinY = Math.min(this.baseMeshMinY, track.position.y - MarbleRunSimulatorCore.tileHeight * (track.h + 1));
                this.baseMeshMaxY = Math.max(this.baseMeshMaxY, track.position.y);
                this.baseMeshMinZ = Math.min(this.baseMeshMinZ, track.position.z - MarbleRunSimulatorCore.tileDepth * (track.d - 0.5));
                this.baseMeshMaxZ = Math.max(this.baseMeshMaxZ, track.position.z);
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
                if (this.baseWall) {
                    this.baseWall.dispose();
                }
                this.baseWall = BABYLON.MeshBuilder.CreatePlane("base-wall", { width: h + 2 * this.margin, height: w + 2 * this.margin, sideOrientation: BABYLON.Mesh.DOUBLESIDE, frontUVs: new BABYLON.Vector4(0, 0, v, u) });
                this.baseWall.position.x = (this.baseMeshMaxX + this.baseMeshMinX) * 0.5;
                this.baseWall.position.y = (this.baseMeshMaxY + this.baseMeshMinY) * 0.5;
                this.baseWall.position.z += 0.016;
                this.baseWall.rotation.z = Math.PI / 2;
                if (this.baseFrame) {
                    this.baseFrame.dispose();
                }
                this.baseFrame = new BABYLON.Mesh("base-frame");
                this.baseFrame.position.copyFrom(this.baseWall.position);
                this.baseFrame.material = this.game.materials.metalMaterials[0];
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
                    this.baseFrame.dispose();
                }
                this.baseFrame = new BABYLON.Mesh("base-stand");
                this.baseFrame.position.x = (this.baseMeshMaxX + this.baseMeshMinX) * 0.5;
                this.baseFrame.position.y = this.baseMeshMinY;
                this.baseFrame.position.z = (this.baseMeshMaxZ + this.baseMeshMinZ) * 0.5;
                this.baseFrame.material = this.game.materials.whiteMaterial;
                let vertexDatas = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/museum-stand.babylon");
                let data = Mummu.CloneVertexData(vertexDatas[0]);
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
                if (this.baseWall) {
                    this.baseWall.dispose();
                }
                this.baseWall = new BABYLON.Mesh("base-top");
                this.baseWall.receiveShadows = true;
                this.baseWall.position.x = (this.baseMeshMaxX + this.baseMeshMinX) * 0.5;
                this.baseWall.position.y = this.baseMeshMinY;
                this.baseWall.position.z = (this.baseMeshMaxZ + this.baseMeshMinZ) * 0.5;
                this.baseWall.material = this.game.materials.velvetMaterial;
                data = Mummu.CloneVertexData(vertexDatas[1]);
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
                    uvs.push(positions[3 * i] * 2);
                    uvs.push(positions[3 * i + 2] * 2);
                }
                data.positions = positions;
                data.uvs = uvs;
                data.applyToMesh(this.baseWall);
                if (this.baseLogo) {
                    this.baseLogo.dispose();
                }
                this.baseLogo = new BABYLON.Mesh("base-logo");
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
            this.game.spotLight.position.y = this.baseMeshMinY + 2.2;
            let dir = new BABYLON.Vector3((this.baseMeshMinX + this.baseMeshMaxX) * 0.5, -3, (this.baseMeshMinZ + this.baseMeshMaxZ) * 0.5).normalize();
            this.game.spotLight.direction = dir;
        }
        regenerateBaseAxis() {
            if (this.baseAxis) {
                this.baseAxis.dispose();
            }
            if (this.game.mode === GameMode.Create) {
                let w = this.baseMeshMaxX - this.baseMeshMinX;
                let d = this.baseMeshMaxZ - this.baseMeshMinZ;
                let w05 = w * 0.5;
                let d05 = d * 0.5;
                let s = Math.min(w05, d05) * 0.9;
                this.baseAxis = new BABYLON.Mesh("base-logo");
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
            if (this.baseWall) {
                this.baseWall.isVisible = v;
            }
            if (this.baseLogo) {
                this.baseLogo.isVisible = v;
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
                            return { isEnd: false, bank: track.preferedStartBank, part: part };
                        }
                        if (BABYLON.Vector3.DistanceSquared(track.endWorldPosition, pos) < 0.000001) {
                            return { isEnd: true, bank: track.preferedEndBank, part: part };
                        }
                    }
                }
            }
        }
        serialize() {
            return this.serializeV345(5);
        }
        serializeV1() {
            let data = {
                name: this.name,
                author: this.author,
                balls: [],
                parts: [],
            };
            for (let i = 0; i < this.balls.length; i++) {
                data.balls.push({
                    x: this.balls[i].positionZero.x,
                    y: this.balls[i].positionZero.y,
                    z: this.balls[i].positionZero.z,
                });
            }
            for (let i = 0; i < this.parts.length; i++) {
                data.parts.push({
                    name: this.parts[i].partName,
                    i: this.parts[i].i,
                    j: this.parts[i].j,
                    k: this.parts[i].k,
                    mirrorX: this.parts[i].mirrorX,
                    mirrorZ: this.parts[i].mirrorZ,
                    c: this.parts[i].colors,
                });
            }
            return data;
        }
        serializeV2() {
            let data = {
                n: this.name,
                a: this.author,
                v: 2
            };
            let dataString = "";
            // Add ball count
            dataString += NToHex(this.balls.length, 2);
            for (let i = 0; i < this.balls.length; i++) {
                let ball = this.balls[i];
                let x = Math.round(ball.positionZero.x * 1000) + ballOffset;
                let y = Math.round(ball.positionZero.y * 1000) + ballOffset;
                let z = Math.round(ball.positionZero.z * 1000) + ballOffset;
                dataString += NToHex(x, 3);
                dataString += NToHex(y, 3);
                dataString += NToHex(z, 3);
            }
            // Add parts count
            dataString += NToHex(this.parts.length, 2);
            for (let i = 0; i < this.parts.length; i++) {
                let partDataString = "";
                let part = this.parts[i];
                let baseName = part.partName.split("-")[0];
                let index = MarbleRunSimulatorCore.TrackNames.findIndex((name) => {
                    return name.startsWith(baseName);
                });
                if (index === -1) {
                    console.error("Error, can't find part index.");
                    debugger;
                }
                partDataString += NToHex(index, 2);
                let pI = part.i + partOffset;
                let pJ = part.j + partOffset;
                let pK = part.k + partOffset;
                partDataString += NToHex(pI, 2);
                partDataString += NToHex(pJ, 2);
                partDataString += NToHex(pK, 2);
                partDataString += NToHex(part.w, 1);
                partDataString += NToHex(part.h, 1);
                partDataString += NToHex(part.d, 1);
                partDataString += NToHex(part.n, 1);
                let m = (part.mirrorX ? 1 : 0) + (part.mirrorZ ? 2 : 0);
                partDataString += NToHex(m, 1);
                let colourCount = part.colors.length;
                partDataString += NToHex(colourCount, 1);
                for (let j = 0; j < part.colors.length; j++) {
                    let c = part.colors[j];
                    partDataString += NToHex(c, 1);
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
        serializeV345(version) {
            let data = {
                n: this.name,
                a: this.author,
                v: version
            };
            let dataString = "";
            // Add ball count
            dataString += NToHex(this.balls.length, 2);
            for (let i = 0; i < this.balls.length; i++) {
                let ball = this.balls[i];
                let x = Math.round(ball.positionZero.x * 1000) + ballOffset;
                let y = Math.round(ball.positionZero.y * 1000) + ballOffset;
                let z = Math.round(ball.positionZero.z * 1000) + ballOffset;
                dataString += NToHex(x, 3);
                dataString += NToHex(y, 3);
                dataString += NToHex(z, 3);
                if (version === 4) {
                    dataString += NToHex(ball.materialIndex, 2);
                }
            }
            // Add parts count
            dataString += NToHex(this.parts.length, 2);
            for (let i = 0; i < this.parts.length; i++) {
                let partDataString = "";
                let part = this.parts[i];
                let baseName = part.partName.split("-")[0];
                let index = MarbleRunSimulatorCore.TrackNames.findIndex((name) => {
                    return name.startsWith(baseName);
                });
                console.log(part.partName + " " + baseName + " " + index);
                if (index === -1) {
                    console.error("Error, can't find part index.");
                    debugger;
                }
                partDataString += NToHex(index, 2);
                let pI = part.i + partOffset;
                let pJ = part.j + partOffset;
                let pK = part.k + partOffset;
                partDataString += NToHex(pI, 2);
                partDataString += NToHex(pJ, 2);
                partDataString += NToHex(pK, 2);
                partDataString += NToHex(part.w, 1);
                partDataString += NToHex(part.h, 1);
                partDataString += NToHex(part.d, 1);
                partDataString += NToHex(part.n, 1);
                let m = (part.mirrorX ? 1 : 0) + (part.mirrorZ ? 2 : 0);
                partDataString += NToHex(m, 1);
                let colourCount = part.colors.length;
                partDataString += NToHex(colourCount, 1);
                for (let j = 0; j < part.colors.length; j++) {
                    let c = part.colors[j];
                    partDataString += NToHex(c, 1);
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
        deserialize(data) {
            if (data) {
                let version;
                if (isFinite(data.v)) {
                    version = data.v;
                }
                if (!isFinite(version) || version === 1) {
                    return this.deserializeV1(data);
                }
                else if (version === 2) {
                    return this.deserializeV2(data);
                }
                else if (version === 3 || version === 4 || version === 5) {
                    return this.deserializeV345(data);
                }
            }
        }
        deserializeV1(data) {
            if (data.name) {
                this.name = data.name;
            }
            if (data.author) {
                this.author = data.author;
            }
            this.balls = [];
            this.parts = [];
            for (let i = 0; i < data.balls.length; i++) {
                let ballData = data.balls[i];
                let ball = new MarbleRunSimulatorCore.Ball(new BABYLON.Vector3(ballData.x, ballData.y, isFinite(ballData.z) ? ballData.z : 0), this);
                this.balls.push(ball);
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
                let track = this.trackFactory.createTrack(part.name, prop);
                if (track) {
                    if (data.sleepers) {
                        track.sleepersMeshProp = data.sleepers;
                    }
                    this.parts.push(track);
                }
            }
        }
        deserializeV2(data) {
            let dataString = data.d;
            if (dataString) {
                if (data.n) {
                    this.name = data.n;
                }
                if (data.a) {
                    this.author = data.a;
                }
                this.balls = [];
                this.parts = [];
                let pt = 0;
                let ballCount = parseInt(dataString.substring(pt, pt += 2), 36);
                //console.log("ballCount = " + ballCount);
                for (let i = 0; i < ballCount; i++) {
                    let x = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    //console.log("ball xyz " + x + " " + y + " " + z);
                    let ball = new MarbleRunSimulatorCore.Ball(new BABYLON.Vector3(x, y, z), this);
                    this.balls.push(ball);
                }
                let partCount = parseInt(dataString.substring(pt, pt += 2), 36);
                //console.log("partCount = " + partCount);
                for (let i = 0; i < partCount; i++) {
                    /*
                    partDataString += NToHex(index, 2);
                    
                    let pI = part.i + partOffset;
                    let pJ = part.j + partOffset;
                    let pK = part.k + partOffset;
                    partDataString += NToHex(pI, 2);
                    partDataString += NToHex(pJ, 2);
                    partDataString += NToHex(pK, 2);

                    partDataString += NToHex(part.w, 1);
                    partDataString += NToHex(part.h, 1);
                    partDataString += NToHex(part.d, 1);
                    partDataString += NToHex(part.n, 1);
                    let m = (part.mirrorX ? 1 : 0) + (part.mirrorZ ? 2 : 0);
                    partDataString += NToHex(m, 1);

                    let colourCount = part.colors.length;
                    partDataString += NToHex(colourCount, 1);
                    for (let j = 0; j < part.colors.length; j++) {
                        let c = part.colors[j];
                        partDataString += NToHex(c, 1);
                    }
                    */
                    let index = parseInt(dataString.substring(pt, pt += 2), 36);
                    let baseName = MarbleRunSimulatorCore.TrackNames[index].split("-")[0];
                    //console.log("basename " + baseName);
                    let pI = (parseInt(dataString.substring(pt, pt += 2), 36) - partOffset) * 2;
                    let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                    let pK = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
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
                        i: pI,
                        j: pJ,
                        k: pK,
                        w: w,
                        h: h,
                        d: d,
                        n: n,
                        mirrorX: (mirror % 2) === 1,
                        mirrorZ: mirror >= 2,
                        c: colors
                    };
                    let track = this.trackFactory.createTrackBaseName(baseName, prop);
                    if (track) {
                        this.parts.push(track);
                    }
                }
            }
        }
        deserializeV345(data) {
            let dataString = data.d;
            if (dataString) {
                if (data.n) {
                    this.name = data.n;
                }
                if (data.a) {
                    this.author = data.a;
                }
                this.balls = [];
                this.parts = [];
                let pt = 0;
                let ballCount = parseInt(dataString.substring(pt, pt += 2), 36);
                //console.log("ballCount = " + ballCount);
                for (let i = 0; i < ballCount; i++) {
                    let x = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    //console.log("ball xyz " + x + " " + y + " " + z);
                    let ball = new MarbleRunSimulatorCore.Ball(new BABYLON.Vector3(x, y, z), this);
                    this.balls.push(ball);
                    if (data.v === 4) {
                        let materialIndex = parseInt(dataString.substring(pt, pt += 2), 36);
                        ball.materialIndex = materialIndex;
                    }
                }
                let partCount = parseInt(dataString.substring(pt, pt += 2), 36);
                //console.log("partCount = " + partCount);
                for (let i = 0; i < partCount; i++) {
                    /*
                    partDataString += NToHex(index, 2);
                    
                    let pI = part.i + partOffset;
                    let pJ = part.j + partOffset;
                    let pK = part.k + partOffset;
                    partDataString += NToHex(pI, 2);
                    partDataString += NToHex(pJ, 2);
                    partDataString += NToHex(pK, 2);

                    partDataString += NToHex(part.w, 1);
                    partDataString += NToHex(part.h, 1);
                    partDataString += NToHex(part.d, 1);
                    partDataString += NToHex(part.n, 1);
                    let m = (part.mirrorX ? 1 : 0) + (part.mirrorZ ? 2 : 0);
                    partDataString += NToHex(m, 1);

                    let colourCount = part.colors.length;
                    partDataString += NToHex(colourCount, 1);
                    for (let j = 0; j < part.colors.length; j++) {
                        let c = part.colors[j];
                        partDataString += NToHex(c, 1);
                    }
                    */
                    let index = parseInt(dataString.substring(pt, pt += 2), 36);
                    let baseName = MarbleRunSimulatorCore.TrackNames[index].split("-")[0];
                    let pI = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                    let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                    let pK = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
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
                        i: pI,
                        j: pJ,
                        k: pK,
                        w: w,
                        h: h,
                        d: d,
                        n: n,
                        mirrorX: (mirror % 2) === 1,
                        mirrorZ: mirror >= 2,
                        c: colors
                    };
                    let track = this.trackFactory.createTrackBaseName(baseName, prop);
                    if (track) {
                        this.parts.push(track);
                    }
                    else {
                        console.warn("failed to createTrackBaseName");
                        console.log(baseName);
                        console.log(prop);
                    }
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
            return encloseStart;
        }
        getEncloseEnd() {
            let encloseEnd = new BABYLON.Vector3(-Infinity, Infinity, Infinity);
            this.parts.forEach((part) => {
                encloseEnd.x = Math.max(encloseEnd.x, part.position.x + part.encloseEnd.x);
                encloseEnd.y = Math.min(encloseEnd.y, part.position.y + part.encloseEnd.y);
                encloseEnd.z = Math.min(encloseEnd.z, part.position.z + part.encloseEnd.z);
            });
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
    "Complex "
];
MachineName.PartThrees = [
    "Ball ",
    "Loop ",
    "Curve ",
    "Rail ",
    "Spiral ",
    "Steel ",
    "Track "
];
MachineName.PartFours = [
    "Machine",
    "Factory",
    "Thing",
    "Invention",
    "Construction",
    "Computer"
];
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    MarbleRunSimulatorCore.baseRadius = 0.075;
    MarbleRunSimulatorCore.tileWidth = 0.075;
    MarbleRunSimulatorCore.tileHeight = 0.03;
    MarbleRunSimulatorCore.tileDepth = 0.06;
    MarbleRunSimulatorCore.colorSlotsCount = 6;
    let PartVisibilityMode;
    (function (PartVisibilityMode) {
        PartVisibilityMode[PartVisibilityMode["Default"] = 0] = "Default";
        PartVisibilityMode[PartVisibilityMode["Selected"] = 1] = "Selected";
        PartVisibilityMode[PartVisibilityMode["Ghost"] = 2] = "Ghost";
    })(PartVisibilityMode = MarbleRunSimulatorCore.PartVisibilityMode || (MarbleRunSimulatorCore.PartVisibilityMode = {}));
    var radius = (0.014 * 1.5) / 2;
    var selectorHullShape = [];
    for (let i = 0; i < 6; i++) {
        let a = (i / 6) * 2 * Math.PI;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        selectorHullShape[i] = new BABYLON.Vector3(cosa * radius, sina * radius, 0);
    }
    class MachinePartSelectorMesh extends BABYLON.Mesh {
        constructor(part) {
            super("machine-part-selector");
            this.part = part;
        }
    }
    MarbleRunSimulatorCore.MachinePartSelectorMesh = MachinePartSelectorMesh;
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
            this.isSelectable = true;
            this.summedLength = [0];
            this.totalLength = 0;
            this.globalSlope = 0;
            this.AABBMin = BABYLON.Vector3.Zero();
            this.AABBMax = BABYLON.Vector3.Zero();
            this.encloseStart = BABYLON.Vector3.Zero();
            this.enclose13 = BABYLON.Vector3.One().scaleInPlace(1 / 3);
            this.encloseMid = BABYLON.Vector3.One().scaleInPlace(0.5);
            this.enclose23 = BABYLON.Vector3.One().scaleInPlace(2 / 3);
            this.encloseEnd = BABYLON.Vector3.One();
            this.neighbours = new Nabu.UniqueList();
            this._i = 0;
            this._j = 0;
            this._k = 0;
            this._partVisibilityMode = PartVisibilityMode.Default;
            if (prop.fullPartName) {
                this.fullPartName = prop.fullPartName;
            }
            this._i = prop.i;
            this._j = prop.j;
            this._k = prop.k;
            if (typeof prop.c === "number") {
                this.colors = [prop.c];
            }
            else if (prop.c instanceof Array) {
                this.colors = [...prop.c];
            }
            this.position.x = this._i * MarbleRunSimulatorCore.tileWidth;
            this.position.y = -this._j * MarbleRunSimulatorCore.tileHeight;
            this.position.z = -this._k * MarbleRunSimulatorCore.tileDepth;
            this.sleepersMeshProp = { drawGroundAnchors: true, groundAnchorsRelativeMaxY: 0.6 };
            this.tracks = [new MarbleRunSimulatorCore.Track(this)];
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
        addNeighbour(other) {
            this.neighbours.push(other);
            other.neighbours.push(this);
        }
        removeNeighbour(other) {
            this.neighbours.remove(other);
            other.neighbours.remove(this);
        }
        removeAllNeighbours() {
            while (this.neighbours.length > 0) {
                this.removeNeighbour(this.neighbours.get(0));
            }
        }
        get w() {
            return this.template.w;
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
        get mirrorX() {
            return this.template.mirrorX;
        }
        get mirrorZ() {
            return this.template.mirrorZ;
        }
        get xExtendable() {
            return this.template.xExtendable;
        }
        get yExtendable() {
            return this.template.yExtendable;
        }
        get zExtendable() {
            return this.template.zExtendable;
        }
        get nExtendable() {
            return this.template.nExtendable;
        }
        get minH() {
            return this.template.minH;
        }
        get minD() {
            return this.template.minD;
        }
        get maxD() {
            return this.template.maxD;
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
        get template() {
            return this._template;
        }
        setTemplate(template) {
            this._template = template;
        }
        get i() {
            return this._i;
        }
        setI(v) {
            if (this._i != v) {
                this._i = v;
                if (this.game.mode === MarbleRunSimulatorCore.GameMode.Challenge) {
                    let i = this._i = Nabu.MinMax(this._i, this.game.gridIMin, this.game.gridIMax);
                    if (isFinite(i)) {
                        this._i = i;
                    }
                }
                this.position.x = this._i * MarbleRunSimulatorCore.tileWidth;
                this.isPlaced = true;
                this.freezeWorldMatrix();
                this.getChildMeshes().forEach((m) => {
                    m.freezeWorldMatrix();
                });
                this.machine.requestUpdateShadow = true;
            }
        }
        get j() {
            return this._j;
        }
        setJ(v) {
            if (this._j != v) {
                this._j = v;
                if (this.game.mode === MarbleRunSimulatorCore.GameMode.Challenge) {
                    let j = this._j = Nabu.MinMax(this._j, this.game.gridJMin, this.game.gridJMax);
                    if (isFinite(j)) {
                        this._j = j;
                    }
                }
                this.position.y = -this._j * MarbleRunSimulatorCore.tileHeight;
                this.isPlaced = true;
                this.freezeWorldMatrix();
                this.getChildMeshes().forEach((m) => {
                    m.freezeWorldMatrix();
                });
                this.machine.requestUpdateShadow = true;
            }
        }
        get k() {
            return this._k;
        }
        setK(v) {
            if (this._k != v) {
                this._k = v;
                if (this.game.mode === MarbleRunSimulatorCore.GameMode.Challenge) {
                    let k = Nabu.MinMax(this._k, this.game.gridKMin, this.game.gridKMax);
                    if (isFinite(k)) {
                        this._k = k;
                    }
                }
                this.position.z = -this._k * MarbleRunSimulatorCore.tileDepth;
                this.isPlaced = true;
                this.freezeWorldMatrix();
                this.getChildMeshes().forEach((m) => {
                    m.freezeWorldMatrix();
                });
                this.machine.requestUpdateShadow = true;
            }
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
        select() {
            if (this.selectorMesh) {
                this.selectorMesh.visibility = 0.2;
            }
            if (this.encloseMesh) {
                this.encloseMesh.visibility = 1;
            }
        }
        unselect() {
            if (this.selectorMesh) {
                this.selectorMesh.visibility = 0;
            }
            if (this.encloseMesh) {
                this.encloseMesh.visibility = 0;
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
            let datas = [];
            for (let n = 0; n < this.tracks.length; n++) {
                let points = [...this.tracks[n].templateInterpolatedPoints].map((p) => {
                    return p.clone();
                });
                Mummu.DecimatePathInPlace(points, (10 / 180) * Math.PI);
                let dirStart = points[1].subtract(points[0]).normalize();
                let dirEnd = points[points.length - 1].subtract(points[points.length - 2]).normalize();
                points[0].subtractInPlace(dirStart.scale(this.wireGauge * 0.5));
                points[points.length - 1].addInPlace(dirEnd.scale(this.wireGauge * 0.5));
                let tmp = BABYLON.ExtrudeShape("wire", { shape: selectorHullShape, path: this.tracks[n].templateInterpolatedPoints, closeShape: true, cap: BABYLON.Mesh.CAP_ALL });
                let data = BABYLON.VertexData.ExtractFromMesh(tmp);
                datas.push(data);
                tmp.dispose();
            }
            if (this.selectorMesh) {
                this.selectorMesh.dispose();
            }
            this.selectorMesh = new MachinePartSelectorMesh(this);
            this.selectorMesh.material = this.game.materials.cyanMaterial;
            this.selectorMesh.parent = this;
            if (datas.length) {
                Mummu.MergeVertexDatas(...datas).applyToMesh(this.selectorMesh);
            }
            this.selectorMesh.visibility = 0;
            if (this.encloseMesh) {
                this.encloseMesh.dispose();
            }
            let w = this.w * MarbleRunSimulatorCore.tileWidth;
            let h = (this.h + 1) * MarbleRunSimulatorCore.tileHeight;
            let d = this.d * MarbleRunSimulatorCore.tileDepth;
            let x0 = -MarbleRunSimulatorCore.tileWidth * 0.5;
            let y0 = MarbleRunSimulatorCore.tileHeight * 0.5;
            let z0 = MarbleRunSimulatorCore.tileDepth * 0.5;
            let x1 = x0 + w;
            let y1 = y0 - h;
            let z1 = z0 - d;
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
            this.encloseMesh = BABYLON.MeshBuilder.CreateLineSystem("enclose-mesh", {
                lines: [
                    [new BABYLON.Vector3(x0, y0, z0), new BABYLON.Vector3(x1, y0, z0), new BABYLON.Vector3(x1, y1, z0), new BABYLON.Vector3(x0, y1, z0), new BABYLON.Vector3(x0, y0, z0)],
                    [new BABYLON.Vector3(x0, y0, z0), new BABYLON.Vector3(x0, y0, z1)],
                    [new BABYLON.Vector3(x1, y0, z0), new BABYLON.Vector3(x1, y0, z1)],
                    [new BABYLON.Vector3(x1, y1, z0), new BABYLON.Vector3(x1, y1, z1)],
                    [new BABYLON.Vector3(x0, y1, z0), new BABYLON.Vector3(x0, y1, z1)],
                    [new BABYLON.Vector3(x0, y0, z1), new BABYLON.Vector3(x1, y0, z1), new BABYLON.Vector3(x1, y1, z1), new BABYLON.Vector3(x0, y1, z1), new BABYLON.Vector3(x0, y0, z1)],
                ],
            }, this.getScene());
            this.encloseMesh.parent = this;
            this.encloseMesh.visibility = 0;
            this.rebuildWireMeshes(rebuildNeighboursWireMeshes);
            this.AABBMin.copyFromFloats(this.encloseStart.x, this.encloseEnd.y, this.encloseEnd.z);
            this.AABBMax.copyFromFloats(this.encloseEnd.x, this.encloseStart.y, this.encloseStart.z);
            this.AABBMin.addInPlace(this.position);
            this.AABBMax.addInPlace(this.position);
            this.freezeWorldMatrix();
            this.getChildMeshes().forEach((m) => {
                m.freezeWorldMatrix();
            });
            this.machine.requestUpdateShadow = true;
        }
        dispose() {
            super.dispose();
            this.removeAllNeighbours();
            let index = this.machine.parts.indexOf(this);
            if (index > -1) {
                this.machine.parts.splice(index, 1);
            }
            // REFACTO : MACHINE EDITOR DEPENDANCY
            //if (this.game.mode === GameMode.Challenge) {
            //    this.game.machineEditor.setItemCount(this.fullPartName, this.game.machineEditor.getItemCount(this.fullPartName) + 1);
            //}
        }
        generateWires() {
            this.allWires = [...this.wires];
            if (this.template) {
                for (let i = 0; i < this.template.trackTemplates.length; i++) {
                    let track = this.tracks[i];
                    if (!track) {
                        track = new MarbleRunSimulatorCore.Track(this);
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
        update(dt) { }
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
                track.wires.forEach((wire) => {
                    wire.instantiate(isFinite(wire.colorIndex) ? this.getColor(wire.colorIndex) : this.getColor(track.template.colorIndex));
                });
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
            let q = this.game.getGraphicQ();
            if (q === 0) {
                return;
            }
            let datas = MarbleRunSimulatorCore.SleeperMeshBuilder.GenerateSleepersVertexData(this, this.sleepersMeshProp);
            datas.forEach((vData, colorIndex) => {
                if (!this.sleepersMeshes.get(colorIndex)) {
                    let sleeperMesh = new BABYLON.Mesh("sleeper-mesh-" + colorIndex);
                    sleeperMesh.material = this.game.materials.getMetalMaterial(colorIndex);
                    sleeperMesh.parent = this;
                    this.sleepersMeshes.set(colorIndex, sleeperMesh);
                }
                let sleeperMesh = this.sleepersMeshes.get(colorIndex);
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
    MarbleRunSimulatorCore.TrackNames = [
        "ramp-1.1.1",
        "wave-2.1.1",
        "snake-2.1.1",
        "join",
        "flatjoin",
        "split",
        "uturn-0.2",
        "wall-3.3",
        "uturnsharp",
        "loop-2.1.1",
        "spiral-1.2",
        "elevator-4",
        "stairway-2.4",
        "screw-2.2",
        "start",
        "end",
        "jumper-1",
        "gravitywell",
        "shooter-8",
        "controler",
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
            trackname = trackname.split("-")[0];
            let whdn = "";
            if (isFinite(props.w)) {
                whdn += props.w.toFixed(0) + ".";
            }
            if (isFinite(props.h)) {
                whdn += props.h.toFixed(0) + ".";
            }
            if (isFinite(props.d)) {
                whdn += props.d.toFixed(0) + ".";
            }
            if (isFinite(props.n)) {
                whdn += props.n.toFixed(0) + ".";
            }
            whdn = whdn.substring(0, whdn.length - 1);
            if (whdn.length > 0) {
                trackname += "-" + whdn;
            }
            return this.createTrack(trackname, props);
        }
        createTrack(partName, prop) {
            if (partName.indexOf("_X") != -1) {
                prop.mirrorX = true;
                partName = partName.replace("_X", "");
            }
            if (partName.indexOf("_Z") != -1) {
                prop.mirrorX = true;
                partName = partName.replace("_Z", "");
            }
            if (partName.startsWith("ramp-")) {
                let w = parseInt(partName.split("-")[1].split(".")[0]);
                let h = parseInt(partName.split("-")[1].split(".")[1]);
                let d = parseInt(partName.split("-")[1].split(".")[2]);
                prop.w = w;
                prop.h = h;
                prop.d = d;
                return new MarbleRunSimulatorCore.Ramp(this.machine, prop);
            }
            if (partName.startsWith("wave-")) {
                let w = parseInt(partName.split("-")[1].split(".")[0]);
                let h = parseInt(partName.split("-")[1].split(".")[1]);
                let d = parseInt(partName.split("-")[1].split(".")[2]);
                prop.w = w;
                prop.h = h;
                prop.d = d;
                return new MarbleRunSimulatorCore.Wave(this.machine, prop);
            }
            if (partName.startsWith("snake-")) {
                let w = parseInt(partName.split("-")[1].split(".")[0]);
                prop.w = w;
                return new MarbleRunSimulatorCore.Snake(this.machine, prop);
            }
            if (partName.startsWith("uturn-")) {
                let h = parseInt(partName.split("-")[1].split(".")[0]);
                let d = parseInt(partName.split("-")[1].split(".")[1]);
                prop.h = h;
                prop.d = d;
                if (isFinite(h) && isFinite(d)) {
                    return new MarbleRunSimulatorCore.UTurn(this.machine, prop);
                }
            }
            if (partName.startsWith("wall-")) {
                let h = parseInt(partName.split("-")[1].split(".")[0]);
                let d = parseInt(partName.split("-")[1].split(".")[1]);
                prop.h = h;
                prop.d = d;
                if (isFinite(h) && isFinite(d)) {
                    return new MarbleRunSimulatorCore.Wall(this.machine, prop);
                }
            }
            if (partName === "uturnsharp") {
                return new MarbleRunSimulatorCore.UTurnSharp(this.machine, prop);
            }
            if (partName === "start") {
                return new MarbleRunSimulatorCore.Start(this.machine, prop);
            }
            if (partName === "end") {
                return new MarbleRunSimulatorCore.End(this.machine, prop);
            }
            if (partName.startsWith("jumper-")) {
                let n = parseInt(partName.split("-")[1].split(".")[0]);
                prop.n = n;
                return new MarbleRunSimulatorCore.Jumper(this.machine, prop);
            }
            if (partName === "gravitywell") {
                return new MarbleRunSimulatorCore.GravityWell(this.machine, prop);
            }
            if (partName.startsWith("loop-")) {
                let w = parseInt(partName.split("-")[1].split(".")[0]);
                let d = parseInt(partName.split("-")[1].split(".")[1]);
                let n = parseInt(partName.split("-")[1].split(".")[2]);
                prop.w = w;
                prop.d = d;
                prop.n = n;
                return new MarbleRunSimulatorCore.Loop(this.machine, prop);
            }
            if (partName.startsWith("spiral-")) {
                let w = parseInt(partName.split("-")[1].split(".")[0]);
                let h = parseInt(partName.split("-")[1].split(".")[1]);
                prop.w = w;
                prop.h = h;
                return new MarbleRunSimulatorCore.Spiral(this.machine, prop);
            }
            if (partName === "join") {
                return new MarbleRunSimulatorCore.Join(this.machine, prop);
            }
            if (partName === "flatjoin") {
                return new MarbleRunSimulatorCore.FlatJoin(this.machine, prop);
            }
            if (partName === "split") {
                return new MarbleRunSimulatorCore.Split(this.machine, prop);
            }
            if (partName === "controler") {
                return new MarbleRunSimulatorCore.Controler(this.machine, prop);
            }
            if (partName.startsWith("elevator-")) {
                let h = parseInt(partName.split("-")[1]);
                prop.h = h;
                return new MarbleRunSimulatorCore.Elevator(this.machine, prop);
            }
            if (partName.startsWith("shooter-")) {
                let h = parseInt(partName.split("-")[1]);
                prop.h = h;
                return new MarbleRunSimulatorCore.Shooter(this.machine, prop);
            }
            if (partName.startsWith("stairway-")) {
                let w = parseInt(partName.split("-")[1].split(".")[0]);
                let h = parseInt(partName.split("-")[1].split(".")[1]);
                prop.w = w;
                prop.h = h;
                return new MarbleRunSimulatorCore.Stairway(this.machine, prop);
            }
            if (partName.startsWith("screw-")) {
                let w = parseInt(partName.split("-")[1].split(".")[0]);
                let h = parseInt(partName.split("-")[1].split(".")[1]);
                prop.w = w;
                prop.h = h;
                return new MarbleRunSimulatorCore.Screw(this.machine, prop);
            }
            if (partName === "quarter") {
                return new MarbleRunSimulatorCore.QuarterNote(this.machine, prop);
            }
            if (partName === "double") {
                return new MarbleRunSimulatorCore.DoubleNote(this.machine, prop);
            }
        }
        createTrackBaseName(baseName, prop) {
            if (baseName === "ramp") {
                return new MarbleRunSimulatorCore.Ramp(this.machine, prop);
            }
            if (baseName === "wave") {
                return new MarbleRunSimulatorCore.Wave(this.machine, prop);
            }
            if (baseName === "snake") {
                return new MarbleRunSimulatorCore.Snake(this.machine, prop);
            }
            if (baseName === "uturn") {
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
            if (baseName === "join") {
                return new MarbleRunSimulatorCore.Join(this.machine, prop);
            }
            if (baseName === "flatjoin") {
                return new MarbleRunSimulatorCore.FlatJoin(this.machine, prop);
            }
            if (baseName === "split") {
                return new MarbleRunSimulatorCore.Split(this.machine, prop);
            }
            if (baseName === "controler") {
                return new MarbleRunSimulatorCore.Controler(this.machine, prop);
            }
            if (baseName === "elevator") {
                return new MarbleRunSimulatorCore.Elevator(this.machine, prop);
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
        }
    }
    MarbleRunSimulatorCore.MachinePartFactory = MachinePartFactory;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class SleeperMeshBuilder {
        static GenerateSleepersVertexData(part, props) {
            if (!isFinite(props.spacing)) {
                props.spacing = 0.03;
            }
            if (!isFinite(props.groundAnchorsRelativeMaxY)) {
                props.groundAnchorsRelativeMaxY = 1;
            }
            let q = part.game.getGraphicQ();
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
                if (colorIndex >= 2) {
                    radiusShape *= 2;
                }
                let nShape = 3;
                if (q === 1) {
                    nShape = 4;
                }
                else if (q === 2) {
                    nShape = 6;
                }
                let shape = [];
                for (let i = 0; i < nShape; i++) {
                    let a = (i / nShape) * 2 * Math.PI;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);
                    shape[i] = new BABYLON.Vector3(cosa * radiusShape, sina * radiusShape, 0);
                }
                let radiusPath = part.wireGauge * 0.5;
                let nPath = 4;
                if (q === 1) {
                    nPath = 8;
                }
                else if (q === 2) {
                    nPath = 12;
                }
                let basePath = [];
                for (let i = 0; i <= nPath; i++) {
                    let a = (i / nPath) * Math.PI;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);
                    basePath[i] = new BABYLON.Vector3(cosa * radiusPath, -sina * radiusPath, 0);
                }
                let sleeperPieceVertexDataTypeIndex = colorIndex >= 2 ? 3 : 0;
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
                    let anchor = BABYLON.Vector3.Zero();
                    if (addSleeper && sleeperPieceVertexData) {
                        anchor = new BABYLON.Vector3(0, -radiusPath, 0);
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
                        if (props.drawWallAnchors) {
                            let addAnchor = false;
                            if (part.k === 0 && (n - 1.5) % 3 === 0) {
                                if (anchor.z > -0.01) {
                                    addAnchor = true;
                                }
                            }
                            if (addAnchor) {
                                let anchorCenter = anchor.clone();
                                anchorCenter.z = 0.015;
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
                                let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.001, diameter: 0.01 });
                                let quat = BABYLON.Quaternion.Identity();
                                Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), quat);
                                Mummu.RotateVertexDataInPlace(tmpVertexData, quat);
                                Mummu.TranslateVertexDataInPlace(tmpVertexData, anchorWall);
                                partialsDatas[colorIndex].push(tmpVertexData);
                                tmp.dispose();
                            }
                        }
                        if (props.drawGroundAnchors) {
                            if (((n - 1.5) % 6 === 0 || count === 1) && up.y > 0.1) {
                                let anchorYWorld = anchor.y + part.position.y;
                                let anchorBase = anchor.clone();
                                let minY = part.machine.baseMeshMinY;
                                let maxY = part.machine.baseMeshMaxY;
                                anchorBase.y = part.machine.baseMeshMinY - part.position.y;
                                if (anchorYWorld < minY + props.groundAnchorsRelativeMaxY * (maxY - minY)) {
                                    let rayOrigin = anchor.add(part.position);
                                    let rayDir = new BABYLON.Vector3(0, -1, 0);
                                    rayOrigin.addInPlace(rayDir.scale(0.01));
                                    let ray = new BABYLON.Ray(rayOrigin, rayDir, 3);
                                    let pick = part.game.scene.pickWithRay(ray, (m) => {
                                        return m instanceof MarbleRunSimulatorCore.MachinePartSelectorMesh;
                                    });
                                    if (!pick.hit) {
                                        let fixationPath = [anchor, anchorBase];
                                        let tmp = BABYLON.ExtrudeShape("tmp", { shape: shape, path: fixationPath, closeShape: true, cap: BABYLON.Mesh.CAP_ALL });
                                        let colorIndex = track.part.getColor(track.template.colorIndex);
                                        if (!partialsDatas[colorIndex]) {
                                            partialsDatas[colorIndex] = [];
                                        }
                                        partialsDatas[colorIndex].push(BABYLON.VertexData.ExtractFromMesh(tmp));
                                        tmp.dispose();
                                        let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.002, diameter: 0.008, tessellation: 8 });
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
            this.summedLength = [0];
            this.totalLength = 0;
            this.globalSlope = 0;
            this.AABBMin = BABYLON.Vector3.Zero();
            this.AABBMax = BABYLON.Vector3.Zero();
        }
        mirrorXTrackPointsInPlace() {
            for (let i = 0; i < this.trackpoints.length; i++) {
                this.trackpoints[i].position.x *= -1;
                this.trackpoints[i].position.x += (this.partTemplate.w - 1) * MarbleRunSimulatorCore.tileWidth;
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
            let maxR = 0;
            this.angles = [this.preferedStartBank];
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
                    let rPrev = Math.tan(Math.abs(a) / 2) * (dPrev * 0.5);
                    let rNext = Math.tan(Math.abs(a) / 2) * (dNext * 0.5);
                    let r = (rPrev + rNext) * 0.5;
                    maxR = Math.max(r, maxR);
                    let f = this.partTemplate.minTurnRadius / r;
                    f = Math.max(Math.min(f, 1), 0);
                    this.angles[i] = this.partTemplate.maxAngle * sign * f;
                }
                else {
                    this.angles[i] = 0;
                }
            }
            this.angles.push(this.preferedEndBank);
            let dec = 1;
            for (let i = 1; i < 0.5 * (N - 1); i++) {
                if (Math.abs(this.angles[i]) < Math.abs(this.preferedStartBank) * dec) {
                    this.angles[i] = this.preferedStartBank * dec;
                    dec *= 0.9;
                }
                else {
                    i = Infinity;
                }
            }
            dec = 1;
            for (let i = N - 1 - 1; i > 0.5 * (N - 1); i--) {
                if (Math.abs(this.angles[i]) < Math.abs(this.preferedEndBank) * dec) {
                    this.angles[i] = this.preferedEndBank * dec;
                    dec *= 0.9;
                }
                else {
                    i = -Infinity;
                }
            }
            let tmpAngles = [...this.angles];
            let f = 1;
            for (let n = 0; n < this.partTemplate.angleSmoothSteps; n++) {
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
            this.preferedStartBank = tmpAngles[0];
            this.preferedEndBank = tmpAngles[tmpAngles.length - 1];
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
            this.w = 1;
            this.h = 1;
            this.d = 1;
            this.n = 1;
            this.mirrorX = false;
            this.mirrorZ = false;
            this.angleSmoothSteps = 30;
            this.maxAngle = Math.PI / 4;
            this.minTurnRadius = 0.06;
            this.xExtendable = false;
            this.yExtendable = false;
            this.zExtendable = false;
            this.nExtendable = false;
            this.minH = 0;
            this.minD = 1;
            this.maxD = 10;
            this.xMirrorable = false;
            this.zMirrorable = false;
            this.hasOriginDestinationHandles = false;
            this.trackTemplates = [];
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
                if (partName.startsWith("uturn-")) {
                    let h = parseInt(partName.split("-")[1].split(".")[0]);
                    let d = parseInt(partName.split("-")[1].split(".")[1]);
                    data = MarbleRunSimulatorCore.UTurn.GenerateTemplate(h, d, mirrorX, mirrorZ);
                }
                else if (partName.startsWith("wall-")) {
                    let h = parseInt(partName.split("-")[1].split(".")[0]);
                    let d = parseInt(partName.split("-")[1].split(".")[1]);
                    data = MarbleRunSimulatorCore.Wall.GenerateTemplate(h, d, mirrorX);
                }
                else if (partName === "uturnsharp") {
                    data = MarbleRunSimulatorCore.UTurnSharp.GenerateTemplate(mirrorX);
                }
                else if (partName.startsWith("ramp-")) {
                    let w = parseInt(partName.split("-")[1].split(".")[0]);
                    let h = parseInt(partName.split("-")[1].split(".")[1]);
                    let d = parseInt(partName.split("-")[1].split(".")[2]);
                    data = MarbleRunSimulatorCore.Ramp.GenerateTemplate(w, h, isFinite(d) ? d : 1, mirrorX, mirrorZ);
                }
                else if (partName.startsWith("wave-")) {
                    let w = parseInt(partName.split("-")[1].split(".")[0]);
                    let h = parseInt(partName.split("-")[1].split(".")[1]);
                    let d = parseInt(partName.split("-")[1].split(".")[2]);
                    data = MarbleRunSimulatorCore.Wave.GenerateTemplate(w, h, isFinite(d) ? d : 1, mirrorX, mirrorZ);
                }
                else if (partName.startsWith("snake-")) {
                    let w = parseInt(partName.split("-")[1].split(".")[0]);
                    data = MarbleRunSimulatorCore.Snake.GenerateTemplate(w, mirrorZ);
                }
                else if (partName.startsWith("elevator-")) {
                    let h = parseInt(partName.split("-")[1]);
                    data = MarbleRunSimulatorCore.Elevator.GenerateTemplate(h, mirrorX);
                }
                else if (partName.startsWith("shooter-")) {
                    let h = parseInt(partName.split("-")[1]);
                    data = MarbleRunSimulatorCore.Shooter.GenerateTemplate(h, mirrorX);
                }
                else if (partName.startsWith("stairway-")) {
                    let w = parseInt(partName.split("-")[1].split(".")[0]);
                    let h = parseInt(partName.split("-")[1].split(".")[1]);
                    data = MarbleRunSimulatorCore.Stairway.GenerateTemplate(w, h, mirrorX);
                }
                else if (partName.startsWith("screw-")) {
                    let w = parseInt(partName.split("-")[1].split(".")[0]);
                    let h = parseInt(partName.split("-")[1].split(".")[1]);
                    data = MarbleRunSimulatorCore.Screw.GenerateTemplate(w, h, mirrorX);
                }
                else if (partName === "split") {
                    data = MarbleRunSimulatorCore.Split.GenerateTemplate(mirrorX);
                }
                else if (partName === "controler") {
                    data = MarbleRunSimulatorCore.Controler.GenerateTemplate(mirrorX);
                }
                else if (partName === "flatjoin") {
                    data = MarbleRunSimulatorCore.FlatJoin.GenerateTemplate(mirrorX);
                }
                else if (partName === "join") {
                    data = MarbleRunSimulatorCore.Join.GenerateTemplate(mirrorX);
                }
                else if (partName.startsWith("loop-")) {
                    let w = parseInt(partName.split("-")[1].split(".")[0]);
                    let d = parseInt(partName.split("-")[1].split(".")[1]);
                    let n = parseInt(partName.split("-")[1].split(".")[2]);
                    data = MarbleRunSimulatorCore.Loop.GenerateTemplate(w, d, n, mirrorX, mirrorZ);
                }
                else if (partName.startsWith("spiral-")) {
                    let w = parseInt(partName.split("-")[1].split(".")[0]);
                    let h = parseInt(partName.split("-")[1].split(".")[1]);
                    data = MarbleRunSimulatorCore.Spiral.GenerateTemplate(w, h, mirrorX, mirrorZ);
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
                else if (partName.startsWith("jumper-")) {
                    let n = parseInt(partName.split("-")[1].split(".")[0]);
                    data = MarbleRunSimulatorCore.Jumper.GenerateTemplate(n, mirrorX);
                }
                else if (partName === "gravitywell") {
                    data = MarbleRunSimulatorCore.GravityWell.GenerateTemplate(mirrorX);
                }
                datas[mirrorIndex] = data;
            }
            return data;
        }
    }
    MarbleRunSimulatorCore.TemplateManager = TemplateManager;
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
            return this.template ? this.template.preferedStartBank : 0;
        }
        get startWorldPosition() {
            this._startWorldPosition.copyFrom(this.part.position).addInPlace(this.templateInterpolatedPoints[0]);
            return this._startWorldPosition;
        }
        get preferedEndBank() {
            return this.template ? this.template.preferedEndBank : 0;
        }
        get endWorldPosition() {
            this._endWorldPosition.copyFrom(this.part.position).addInPlace(this.templateInterpolatedPoints[this.templateInterpolatedPoints.length - 1]);
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
        recomputeWiresPath() {
            let N = this.templateInterpolatedPoints.length;
            let angles = [...this.template.angles];
            this.trackInterpolatedNormals = this.template.interpolatedNormals.map((v) => {
                return v.clone();
            });
            //Mummu.DrawDebugPoint(this.startWorldPosition.add(this.endWorldPosition).scale(0.5), 60, BABYLON.Color3.Blue());
            let startBank = this.preferedStartBank;
            let otherS = this.part.machine.getBankAt(this.startWorldPosition, this.part);
            if (otherS) {
                this.part.addNeighbour(otherS.part);
                //Mummu.DrawDebugPoint(this.startWorldPosition, 60, BABYLON.Color3.Green());
                let otherBank = otherS.bank * (otherS.isEnd ? 1 : -1);
                if (this.preferedStartBank * otherBank >= 0) {
                    startBank = Math.sign(this.preferedStartBank + otherBank) * Math.max(Math.abs(this.preferedStartBank), Math.abs(otherBank));
                }
                else {
                    startBank = this.preferedStartBank * 0.5 + otherBank * 0.5;
                }
            }
            let endBank = this.preferedEndBank;
            let otherE = this.part.machine.getBankAt(this.endWorldPosition, this.part);
            if (otherE) {
                this.part.addNeighbour(otherE.part);
                //Mummu.DrawDebugPoint(this.endWorldPosition, 60, BABYLON.Color3.Red());
                let otherBank = otherE.bank * (otherE.isEnd ? -1 : 1);
                if (this.preferedEndBank * otherBank >= 0) {
                    endBank = Math.sign(this.preferedEndBank + otherBank) * Math.max(Math.abs(this.preferedEndBank), Math.abs(otherBank));
                }
                else {
                    endBank = this.preferedEndBank * 0.5 + otherBank * 0.5;
                }
            }
            angles[0] = startBank;
            angles[angles.length - 1] = endBank;
            let f = 1;
            for (let n = 0; n < this.template.partTemplate.angleSmoothSteps; n++) {
                for (let i = 1; i < N - 1; i++) {
                    let aPrev = angles[i - 1];
                    let a = angles[i];
                    let point = this.templateInterpolatedPoints[i];
                    let aNext = angles[i + 1];
                    if (isFinite(aPrev) && isFinite(aNext)) {
                        let prevPoint = this.templateInterpolatedPoints[i - 1];
                        let distPrev = BABYLON.Vector3.Distance(prevPoint, point);
                        let nextPoint = this.templateInterpolatedPoints[i + 1];
                        let distNext = BABYLON.Vector3.Distance(nextPoint, point);
                        let d = distPrev / (distPrev + distNext);
                        angles[i] = (1 - f) * a + f * ((1 - d) * aPrev + d * aNext);
                    }
                    else if (isFinite(aPrev)) {
                        angles[i] = (1 - f) * a + f * aPrev;
                    }
                    else if (isFinite(aNext)) {
                        angles[i] = (1 - f) * a + f * aNext;
                    }
                }
            }
            /*
        let dec = 1;
        for (let i = 1; i <= 0.5 * (N - 1); i++) {
            if (Math.abs(angles[i]) < Math.abs(startBank) * dec) {
                angles[i] = startBank * dec;
                dec *= 0.99;
            }
            else {
                i = Infinity;
            }
        }
        
        dec = 1;
        for (let i = N - 1 - 1; i >= 0.5 * (N - 1); i--) {
            if (Math.abs(angles[i]) < Math.abs(endBank) * dec) {
                angles[i] = endBank * dec;
                dec *= 0.99;
            }
            else {
                i = - Infinity;
            }
        }
        */
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
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Controler extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this._animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;
            this.reset = () => {
                this._moving = false;
                if (this.mirrorX) {
                    this.pivotPass.rotation.z = -Math.PI / 4;
                }
                else {
                    this.pivotPass.rotation.z = Math.PI / 4;
                }
                this.pivotControler.rotation.z = -this.pivotPass.rotation.z * 8 / 13;
                this.pivotPass.freezeWorldMatrix();
                this.pivotPass.getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
                this.pivotControler.freezeWorldMatrix();
                this.pivotControler.getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
                this.wires.forEach((wire) => {
                    wire.recomputeAbsolutePath();
                });
            };
            this._moving = false;
            let partName = "controler";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            this.clicSound = new BABYLON.Sound("clic-sound", "./datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);
            for (let i = this.colors.length; i < 6; i++) {
                this.colors[i] = 0;
            }
            let rCurb = Controler.pivotL * 0.3;
            let axisZMin = -this.wireGauge * 0.6 - MarbleRunSimulatorCore.tileDepth;
            let axisZMax = this.wireGauge * 0.6;
            let q = Mummu.QuaternionFromYZAxis(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0));
            let axisPassVertexData = BABYLON.CreateCylinderVertexData({ height: MarbleRunSimulatorCore.tileDepth * 0.5 + this.wireGauge * 1.2, diameter: 0.001 });
            Mummu.RotateVertexDataInPlace(axisPassVertexData, q);
            Mummu.TranslateVertexDataInPlace(axisPassVertexData, new BABYLON.Vector3(0, 0, -0.25 * MarbleRunSimulatorCore.tileDepth));
            let axisControlerVertexData = BABYLON.CreateCylinderVertexData({ height: MarbleRunSimulatorCore.tileDepth * 0.5 + this.wireGauge * 1.2, diameter: 0.001 });
            Mummu.RotateVertexDataInPlace(axisControlerVertexData, q);
            Mummu.TranslateVertexDataInPlace(axisControlerVertexData, new BABYLON.Vector3(0, MarbleRunSimulatorCore.tileHeight, 0.25 * MarbleRunSimulatorCore.tileDepth));
            this.pivotPass = new BABYLON.Mesh("pivotPass");
            this.pivotPass.position.copyFromFloats(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            this.pivotPass.material = this.game.materials.getMetalMaterial(this.getColor(4));
            this.pivotPass.parent = this;
            let dz = this.wireGauge * 0.5;
            let cog13 = new BABYLON.Mesh("cog13");
            cog13.material = this.game.materials.getMetalMaterial(this.getColor(5));
            cog13.parent = this.pivotPass;
            this.pivotControler = new BABYLON.Mesh("pivotControler");
            this.pivotControler.position.copyFromFloats(0, MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            this.pivotControler.material = this.game.materials.getMetalMaterial(this.getColor(5));
            this.pivotControler.parent = this;
            this.pivotControlerCollider = new BABYLON.Mesh("collider-trigger");
            this.pivotControlerCollider.isVisible = false;
            this.pivotControlerCollider.parent = this.pivotControler;
            let cog8 = new BABYLON.Mesh("cog8");
            cog8.material = this.game.materials.getMetalMaterial(this.getColor(5));
            cog8.parent = this.pivotControler;
            let support = new BABYLON.Mesh("support");
            support.position.copyFromFloats(0, -MarbleRunSimulatorCore.tileHeight * 0.5, -MarbleRunSimulatorCore.tileDepth * 0.5);
            support.parent = this;
            support.material = this.game.materials.getMetalMaterial(this.getColor(4));
            let loadMeshes = async () => {
                let supportData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 2);
                supportData = Mummu.MergeVertexDatas(axisControlerVertexData, axisPassVertexData, supportData);
                supportData.applyToMesh(support);
                let cog8Data = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 0);
                cog8Data = Mummu.CloneVertexData(cog8Data);
                Mummu.TranslateVertexDataInPlace(cog8Data, new BABYLON.Vector3(0, 0, -MarbleRunSimulatorCore.tileDepth * 0.5));
                cog8Data.applyToMesh(cog8);
                let cog13Data = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/cog.babylon", 1);
                cog13Data = Mummu.CloneVertexData(cog13Data);
                Mummu.TranslateVertexDataInPlace(cog13Data, new BABYLON.Vector3(0, 0, -MarbleRunSimulatorCore.tileDepth * 0.5));
                cog13Data.applyToMesh(cog13);
                let arrowData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon", 0);
                arrowData = Mummu.CloneVertexData(arrowData);
                Mummu.TranslateVertexDataInPlace(arrowData, new BABYLON.Vector3(0, 0, axisZMin));
                arrowData.applyToMesh(this.pivotPass);
                let triggerData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/control-trigger.babylon", 0);
                triggerData.applyToMesh(this.pivotControler);
                let triggerColliderData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/control-trigger.babylon", 1);
                triggerColliderData.applyToMesh(this.pivotControlerCollider);
            };
            loadMeshes();
            let wireVertical0 = new MarbleRunSimulatorCore.Wire(this);
            wireVertical0.colorIndex = 5;
            wireVertical0.parent = this.pivotPass;
            wireVertical0.path = [new BABYLON.Vector3(0, Controler.pivotL, -dz - MarbleRunSimulatorCore.tileDepth), new BABYLON.Vector3(0, -Controler.pivotL, -dz - MarbleRunSimulatorCore.tileDepth)];
            let wireVertical1 = new MarbleRunSimulatorCore.Wire(this);
            wireVertical1.colorIndex = 5;
            wireVertical1.parent = this.pivotPass;
            wireVertical1.path = [new BABYLON.Vector3(0, Controler.pivotL, dz - MarbleRunSimulatorCore.tileDepth), new BABYLON.Vector3(0, -Controler.pivotL, dz - MarbleRunSimulatorCore.tileDepth)];
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
                this.pivotControler.rotation.z = -this.pivotPass.rotation.z * 8 / 13;
                this.pivotControler.freezeWorldMatrix();
                this.pivotControler.getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
                this.wires.forEach((wire) => {
                    wire.recomputeAbsolutePath();
                });
            }, false, Nabu.Easing.easeInSquare);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "controler";
            template.w = 1;
            template.h = 1;
            template.d = 2;
            template.mirrorX = mirrorX;
            template.xMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let pEndLeft = new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            pEndLeft.x -= Controler.pivotL / Math.SQRT2;
            pEndLeft.y += Controler.pivotL / Math.SQRT2;
            let pEndRight = new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            pEndRight.x += Controler.pivotL / Math.SQRT2;
            pEndRight.y += Controler.pivotL / Math.SQRT2;
            let dirEnd = MarbleRunSimulatorCore.Tools.V3Dir(135);
            // Control
            // Control In Left
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], pEndLeft.subtract(dirEnd.scale(0.001)), dirEnd)
            ];
            // Control In Right
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir.multiplyByFloats(-1, 1, 1)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], pEndRight.subtract(dirEnd.scale(0.001).multiplyByFloats(-1, 1, 1)), dirEnd.multiplyByFloats(-1, 1, 1))
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
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, -MarbleRunSimulatorCore.tileDepth), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], pEndLeft.subtract(dirEnd.scale(0.001)).subtractFromFloats(0, 0, MarbleRunSimulatorCore.tileDepth), dirEnd)
            ];
            // Pass out Left
            template.trackTemplates[4] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[4].colorIndex = 2;
            template.trackTemplates[4].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, -MarbleRunSimulatorCore.tileDepth), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(-MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2, -MarbleRunSimulatorCore.tileHeight * 0.5 - MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2 - 0.001, -MarbleRunSimulatorCore.tileDepth), dirEnd.multiplyByFloats(1, -1, 1))
            ];
            // Pass out Right
            template.trackTemplates[5] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[5].colorIndex = 3;
            template.trackTemplates[5].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[5], new BABYLON.Vector3(MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2, -MarbleRunSimulatorCore.tileHeight * 0.5 - MarbleRunSimulatorCore.Split.pivotL / Math.SQRT2 - 0.001, -MarbleRunSimulatorCore.tileDepth), dirEnd),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[5], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, -MarbleRunSimulatorCore.tileDepth), dir)
            ];
            // Shield
            template.trackTemplates[6] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[6].colorIndex = 4;
            template.trackTemplates[6].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[6], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.25, 0.016, -MarbleRunSimulatorCore.tileDepth), MarbleRunSimulatorCore.Tools.V3Dir(100), new BABYLON.Vector3(0, -1, 0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[6], new BABYLON.Vector3(0, 0.005, -MarbleRunSimulatorCore.tileDepth)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[6], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.25, 0.016, -MarbleRunSimulatorCore.tileDepth), MarbleRunSimulatorCore.Tools.V3Dir(80), new BABYLON.Vector3(0, -1, 0)),
            ];
            template.trackTemplates[6].drawStartTip = true;
            template.trackTemplates[6].drawEndTip = true;
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
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivotControler.absolutePosition) < 0.05) {
                        let local = BABYLON.Vector3.TransformCoordinates(ball.position, this.pivotControler.getWorldMatrix().clone().invert());
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
    Controler.pivotL = 0.014;
    MarbleRunSimulatorCore.Controler = Controler;
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
            this.l = 0;
            this.p = 0;
            this.chainLength = 0;
            this.speed = 0.04; // in m/s
            let partName = "elevator-" + prop.h.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            let x = 1;
            if (prop.mirrorX) {
                x = -1;
            }
            this.wheels = [new BABYLON.Mesh("wheel-0"), new BABYLON.Mesh("wheel-1")];
            this.wheels[0].position.copyFromFloats(0.03 * x + MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * (this.h + 0.35), 0);
            this.wheels[0].parent = this;
            this.wheels[0].material = this.game.materials.getMetalMaterial(0);
            this.wheels[1].position.copyFromFloats(0.03 * x + MarbleRunSimulatorCore.tileWidth * 0.5, 0.035 - MarbleRunSimulatorCore.tileHeight, 0);
            this.wheels[1].parent = this;
            this.wheels[1].material = this.game.materials.getMetalMaterial(0);
            this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/wheel.babylon").then((vertexDatas) => {
                let vertexData = vertexDatas[0];
                if (vertexData) {
                    vertexData.applyToMesh(this.wheels[0]);
                    vertexData.applyToMesh(this.wheels[1]);
                }
            });
            this.wires = [];
            this.l = Math.abs(this.wheels[1].position.y - this.wheels[0].position.y);
            this.p = 2 * Math.PI * this.rWheel;
            this.chainLength = 2 * this.l + this.p;
            this.boxesCount = Math.round(this.chainLength / 0.08);
            for (let i = 0; i < this.boxesCount; i++) {
                let box = new BABYLON.Mesh("box");
                box.rotationQuaternion = BABYLON.Quaternion.Identity();
                box.parent = this;
                let rRamp = this.wireGauge * 0.35;
                let nRamp = 12;
                let rampWire0 = new MarbleRunSimulatorCore.Wire(this);
                rampWire0.path = [new BABYLON.Vector3(-0.02 * x, 0.0015, rRamp)];
                for (let i = 0; i <= nRamp * 0.5; i++) {
                    let a = (i / nRamp) * Math.PI;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);
                    rampWire0.path.push(new BABYLON.Vector3((sina * rRamp - rRamp - 0.0005) * x, 0, cosa * rRamp));
                }
                rampWire0.parent = box;
                let rampWire1 = new MarbleRunSimulatorCore.Wire(this);
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
            for (let i = 0; i <= 16; i++) {
                let a = (i / 16) * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                pathCable.push(new BABYLON.Vector3(x0 - cosa * this.rWheel, y0 + sina * this.rWheel));
            }
            this.cable = BABYLON.ExtrudeShape("wire", { shape: cableShape, path: pathCable, closeShape: true, closePath: true });
            this.cable.material = this.game.materials.leatherMaterial;
            this.cable.parent = this;
            this.generateWires();
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }
        static GenerateTemplate(h, mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "elevator-" + h.toFixed(0);
            template.w = 2;
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
            let dx = this.speed * dt * this.game.currentTimeFactor;
            let x = 1;
            if (this.mirrorX) {
                x = -1;
            }
            this.x += dx;
            while (this.x > this.chainLength) {
                this.x -= this.chainLength;
            }
            for (let i = 0; i < this.boxesCount; i++) {
                this.boxX[i] = this.x + (i / this.boxesCount) * this.chainLength;
                while (this.boxX[i] > this.chainLength) {
                    this.boxX[i] -= this.chainLength;
                }
                if (this.boxX[i] < this.l) {
                    this.boxes[i].position.x = this.wheels[0].position.x - this.rWheel * x;
                    this.boxes[i].position.y = this.wheels[0].position.y + this.boxX[i];
                    Mummu.QuaternionFromXZAxisToRef(BABYLON.Axis.X, BABYLON.Axis.Z, this.boxes[i].rotationQuaternion);
                }
                else if (this.boxX[i] < this.l + 0.5 * this.p) {
                    let a = ((this.boxX[i] - this.l) / (0.5 * this.p)) * Math.PI;
                    this.boxes[i].position.x = this.wheels[1].position.x - Math.cos(a) * this.rWheel * x;
                    this.boxes[i].position.y = this.wheels[1].position.y + Math.sin(a) * this.rWheel;
                    let right = this.wheels[1].position.subtract(this.boxes[i].position).normalize();
                    Mummu.QuaternionFromXZAxisToRef(right.scale(x), BABYLON.Axis.Z, this.boxes[i].rotationQuaternion);
                }
                else if (this.boxX[i] < 2 * this.l + 0.5 * this.p) {
                    this.boxes[i].position.x = this.wheels[0].position.x + this.rWheel * x;
                    this.boxes[i].position.y = this.wheels[1].position.y - (this.boxX[i] - (this.l + 0.5 * this.p));
                    Mummu.QuaternionFromXZAxisToRef(BABYLON.Axis.X.scale(-1), BABYLON.Axis.Z, this.boxes[i].rotationQuaternion);
                }
                else {
                    let a = ((this.boxX[i] - (2 * this.l + 0.5 * this.p)) / (0.5 * this.p)) * Math.PI;
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
            let partName = "end";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            this.generateWires();
        }
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "end";
            template.w = 2;
            template.mirrorX = mirrorX;
            template.xMirrorable = true;
            let x0 = MarbleRunSimulatorCore.tileWidth * 0.3;
            let y0 = -1.4 * MarbleRunSimulatorCore.tileHeight;
            let w = MarbleRunSimulatorCore.tileWidth * 0.6;
            let r = 0.01;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.2 + MarbleRunSimulatorCore.tileWidth * 0.5, -0.01, 0), MarbleRunSimulatorCore.Tools.V3Dir(120))];
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - w + MarbleRunSimulatorCore.tileWidth * 0.5, y0 + 1.6 * r, 0), MarbleRunSimulatorCore.Tools.V3Dir(180), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - w + MarbleRunSimulatorCore.tileWidth * 0.5, y0 + r, 0), MarbleRunSimulatorCore.Tools.V3Dir(180)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - w + r + MarbleRunSimulatorCore.tileWidth * 0.5, y0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - 0.012 + MarbleRunSimulatorCore.tileWidth * 0.5, y0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - 0.001 + MarbleRunSimulatorCore.tileWidth * 0.5, y0 - 0.005, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + MarbleRunSimulatorCore.tileWidth * 0.5, y0 - 0.005, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + 0.001 + MarbleRunSimulatorCore.tileWidth * 0.5, y0 - 0.005, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + 0.012 + MarbleRunSimulatorCore.tileWidth * 0.5, y0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + w - r + MarbleRunSimulatorCore.tileWidth * 0.5, y0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + w + MarbleRunSimulatorCore.tileWidth * 0.5, y0 + r, 0), MarbleRunSimulatorCore.Tools.V3Dir(0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + w + MarbleRunSimulatorCore.tileWidth * 0.5, y0 + 1.6 * r, 0), MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(-90)),
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
            let partName = "flatjoin";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            for (let i = this.colors.length; i < 3; i++) {
                this.colors[i] = 0;
            }
            this.generateWires();
        }
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "flatjoin";
            template.w = 1;
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
    class GravityWell extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.wellPath = [];
            let partName = "gravitywell";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            this.wellPath = [new BABYLON.Vector3(0.012, 0, 0), new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth, MarbleRunSimulatorCore.tileHeight * 0.9, 0)];
            Mummu.CatmullRomPathInPlace(this.wellPath, MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(0));
            Mummu.CatmullRomPathInPlace(this.wellPath, MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(0));
            Mummu.CatmullRomPathInPlace(this.wellPath, MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(0));
            Mummu.CatmullRomPathInPlace(this.wellPath, MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(0));
            this.wellPath.splice(0, 0, new BABYLON.Vector3(0.01, -0.01, 0));
            this.wellPath.push(new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth, MarbleRunSimulatorCore.tileHeight * 1, 0));
            this.wellMesh = BABYLON.MeshBuilder.CreateLathe("gravitywell-mesh", { shape: this.wellPath, tessellation: 32, sideOrientation: BABYLON.Mesh.DOUBLESIDE });
            this.wellMesh.material = machine.game.materials.getMetalMaterial(0);
            this.wellMesh.position.copyFromFloats(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * 1.6, -MarbleRunSimulatorCore.tileDepth);
            this.wellMesh.parent = this;
            let wireTop = BABYLON.MeshBuilder.CreateTorus("wire-top", { diameter: MarbleRunSimulatorCore.tileWidth * 2, thickness: this.wireSize, tessellation: 32 });
            wireTop.material = this.wellMesh.material;
            wireTop.position.y = MarbleRunSimulatorCore.tileHeight * 1;
            wireTop.parent = this.wellMesh;
            let wireBottom = BABYLON.MeshBuilder.CreateTorus("wire-top", { diameter: 0.01 * 2, thickness: this.wireSize, tessellation: 32 });
            wireBottom.material = this.wellMesh.material;
            wireBottom.position.y = -0.01;
            wireBottom.parent = this.wellMesh;
            this.generateWires();
        }
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.w = 2;
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
            let partName = "join";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            for (let i = this.colors.length; i < 3; i++) {
                this.colors[i] = 0;
            }
            this.generateWires();
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
            let partName = "jumper-" + prop.n.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            this.generateWires();
        }
        static GenerateTemplate(n, mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "jumper-" + n.toFixed(0);
            template.w = 2;
            template.h = 2;
            template.n = n;
            template.mirrorX = mirrorX;
            template.nExtendable = true;
            template.xMirrorable = true;
            let d = 2.5 * MarbleRunSimulatorCore.tileHeight;
            let aDeg = template.n * 10;
            let aRad = (aDeg / 180) * Math.PI;
            let xEnd = MarbleRunSimulatorCore.tileWidth * 0.5 + Math.cos(aRad) * d;
            let yEnd = -MarbleRunSimulatorCore.tileHeight * template.h + Math.sin(aRad) * d;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xEnd, yEnd, 0), MarbleRunSimulatorCore.Tools.V3Dir(90 - aDeg))];
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
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
    class Loop extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            if (!isFinite(prop.n)) {
                prop.n = 1;
            }
            prop.n = Math.min(prop.n, 2 * prop.d);
            let partName = "loop-" + prop.w.toFixed(0) + "." + prop.d.toFixed(0) + "." + prop.n.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }
        static GenerateTemplate(w, d, n, mirrorX, mirrorZ) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "loop-" + w.toFixed(0) + "." + d.toFixed(0) + "." + n.toFixed(0);
            template.angleSmoothSteps = 20;
            template.w = w;
            template.h = 4;
            template.d = d;
            template.n = n;
            template.mirrorX = mirrorX;
            template.mirrorZ = mirrorZ;
            template.xExtendable = true;
            template.zExtendable = true;
            template.nExtendable = true;
            template.xMirrorable = true;
            template.zMirrorable = true;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].onNormalEvaluated = (n) => {
                n.z = 0;
                n.normalize();
            };
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -template.h * MarbleRunSimulatorCore.tileHeight, 0), MarbleRunSimulatorCore.Tools.V3Dir(90))];
            let nLoops = n;
            let xCenterStart = 0 + MarbleRunSimulatorCore.tileWidth * 0.5;
            let xCenterEnd = MarbleRunSimulatorCore.tileWidth * (template.w - 2) + MarbleRunSimulatorCore.tileWidth * 0.5;
            let r = MarbleRunSimulatorCore.tileWidth * 0.7;
            let depthStart = 0.013;
            let depthEnd = -0.013;
            if (d > 1) {
                depthStart = 0;
                depthEnd = -MarbleRunSimulatorCore.tileDepth * (template.d - 1);
            }
            for (let n = 0; n <= 8 * nLoops; n++) {
                let f = (n + 0) / (8 * nLoops);
                let a = (2 * Math.PI * n) / 8;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(sina * r + f * (xCenterEnd - xCenterStart) + xCenterStart, r * 1 - cosa * r - template.h * MarbleRunSimulatorCore.tileHeight, f * (depthEnd - depthStart) + depthStart)));
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * (template.w - 0.5), -template.h * MarbleRunSimulatorCore.tileHeight, -MarbleRunSimulatorCore.tileDepth * (template.d - 1)), MarbleRunSimulatorCore.Tools.V3Dir(90)));
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
    MarbleRunSimulatorCore.Loop = Loop;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class MachinePartWithOriginDestination extends MarbleRunSimulatorCore.MachinePart {
        getOrigin() {
            let i = this.i;
            let j;
            if (this.mirrorX) {
                j = this.j + this.h;
            }
            else {
                j = this.j;
            }
            let k;
            if (this.mirrorZ) {
                if (this.mirrorX) {
                    k = this.k;
                }
                else {
                    k = this.k + this.d - 1;
                }
            }
            else {
                if (this.mirrorX) {
                    k = this.k + this.d - 1;
                }
                else {
                    k = this.k;
                }
            }
            return {
                i: i,
                j: j,
                k: k,
            };
        }
        getDestination() {
            let i = this.i + this.w;
            let j;
            if (!this.mirrorX) {
                j = this.j + this.h;
            }
            else {
                j = this.j;
            }
            let k;
            if (this.mirrorZ) {
                if (this.mirrorX) {
                    k = this.k + this.d - 1;
                }
                else {
                    k = this.k;
                }
            }
            else {
                if (this.mirrorX) {
                    k = this.k;
                }
                else {
                    k = this.k + this.d - 1;
                }
            }
            return {
                i: i,
                j: j,
                k: k,
            };
        }
    }
    MarbleRunSimulatorCore.MachinePartWithOriginDestination = MachinePartWithOriginDestination;
    class Ramp extends MachinePartWithOriginDestination {
        constructor(machine, prop) {
            super(machine, prop);
            let partName = "ramp-" + prop.w.toFixed(0) + "." + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }
        static GenerateTemplate(w = 1, h = 1, d = 1, mirrorX, mirrorZ) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "ramp-" + w.toFixed(0) + "." + h.toFixed(0) + "." + d.toFixed(0);
            template.w = w;
            template.h = h;
            template.d = d;
            template.mirrorX = mirrorX;
            template.mirrorZ = mirrorZ;
            template.xExtendable = true;
            template.yExtendable = true;
            template.zExtendable = true;
            template.xMirrorable = true;
            template.zMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let xCenter = (-MarbleRunSimulatorCore.tileWidth * 0.5 + MarbleRunSimulatorCore.tileWidth * (template.w - 0.5)) * 0.5;
            let zCenter = (0 - MarbleRunSimulatorCore.tileDepth * (template.d - 1)) * 0.5;
            let widthInM = MarbleRunSimulatorCore.tileWidth * template.w;
            let depthInM = MarbleRunSimulatorCore.tileDepth * (template.d - 1);
            let radius = Math.min(widthInM, depthInM) * 0.5;
            let r2 = radius / Math.SQRT2 * 1.0;
            let r12 = radius - r2;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            if (radius === 0 || widthInM > depthInM * 1.5) {
                template.trackTemplates[0].trackpoints = [
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir),
                    new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * (template.w - 0.5), -MarbleRunSimulatorCore.tileHeight * template.h, -MarbleRunSimulatorCore.tileDepth * (template.d - 1)), dir)
                ];
            }
            else {
                if (widthInM > depthInM) {
                    template.trackTemplates[0].trackpoints = [
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter - radius, 0, 0), dir),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter - r12, 0, zCenter + r2)),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter, 0, zCenter), new BABYLON.Vector3(0, 0, -1)),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter + r12, 0, zCenter - r2)),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter + radius, 0, -MarbleRunSimulatorCore.tileDepth * (template.d - 1)), dir),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * (template.w - 0.5), -MarbleRunSimulatorCore.tileHeight * template.h, -MarbleRunSimulatorCore.tileDepth * (template.d - 1)), dir),
                    ];
                }
                else if (widthInM < depthInM) {
                    template.trackTemplates[0].trackpoints = [
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5 + r2, 0, -r12)),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter, 0, -radius), new BABYLON.Vector3(0, 0, -1)),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter, 0, -MarbleRunSimulatorCore.tileDepth * (template.d - 1) + radius), new BABYLON.Vector3(0, 0, -1)),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * (template.w - 0.5) - r2, 0, -MarbleRunSimulatorCore.tileDepth * (template.d - 1) + r12)),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * (template.w - 0.5), -MarbleRunSimulatorCore.tileHeight * template.h, -MarbleRunSimulatorCore.tileDepth * (template.d - 1)), dir),
                    ];
                }
                else {
                    template.trackTemplates[0].trackpoints = [
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5 + r2, 0, -r12)),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter, 0, zCenter), new BABYLON.Vector3(0, 0, -1)),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * (template.w - 0.5) - r2, 0, -MarbleRunSimulatorCore.tileDepth * (template.d - 1) + r12)),
                        new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * (template.w - 0.5), -MarbleRunSimulatorCore.tileHeight * template.h, -MarbleRunSimulatorCore.tileDepth * (template.d - 1)), dir),
                    ];
                }
                let tmpDir = new BABYLON.Vector3(widthInM * 0.5, 0, 0);
                let tmpStart = template.trackTemplates[0].trackpoints[0].position.clone();
                let tmpEnd = template.trackTemplates[0].trackpoints[template.trackTemplates[0].trackpoints.length - 1].position.clone();
                tmpStart.z = 0;
                tmpEnd.z = 0;
                for (let n = 1; n < template.trackTemplates[0].trackpoints.length - 1; n++) {
                    let trackpoint = template.trackTemplates[0].trackpoints[n];
                    let dx = (trackpoint.position.x - (-MarbleRunSimulatorCore.tileWidth * 0.5)) / widthInM;
                    console.log(dx);
                    let tmpPoint = BABYLON.Vector3.Hermite(tmpStart, tmpDir, tmpEnd, tmpDir, dx);
                    console.log(tmpPoint.y);
                    trackpoint.position.y = tmpPoint.y;
                }
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
            return new Ramp(machine, {
                i: i,
                j: j,
                k: k,
                w: w,
                h: h,
                d: d,
                c: this.colors,
                mirrorX: mirrorX,
                mirrorZ: mirrorZ,
            });
        }
    }
    MarbleRunSimulatorCore.Ramp = Ramp;
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
            this.reset = () => { };
            this.l = 0;
            this.p = 0;
            this.speed = 2 * Math.PI; // in m/s
            this.a = 0;
            let partName = "screw-" + prop.w.toFixed(0) + "." + prop.h.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            let x = 1;
            if (prop.mirrorX) {
                x = -1;
            }
            this.x0 = -MarbleRunSimulatorCore.tileWidth * 0.3;
            this.x1 = MarbleRunSimulatorCore.tileWidth * 0.3 + (this.w - 1) * MarbleRunSimulatorCore.tileWidth;
            this.y0 = -MarbleRunSimulatorCore.tileHeight * (this.h - 2 + 0.05) - 0.005;
            this.y1 = MarbleRunSimulatorCore.tileHeight * 0.05 + 0.005;
            if (prop.mirrorX) {
                let yT = this.y0;
                this.y0 = this.y1;
                this.y1 = yT;
            }
            for (let i = this.colors.length; i < 5; i++) {
                this.colors[i] = 0;
            }
            let r = 0.014;
            let period = 0.022;
            let p0 = new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * this.h, 0);
            p0.x += 0.03;
            p0.y -= 0.005;
            let p1 = new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * (this.w - 0.5), 0, -MarbleRunSimulatorCore.tileDepth * (this.d - 1));
            p1.x -= 0.03;
            p1.y += 0.005;
            if (this.mirrorX) {
                let tmpP = p0.clone();
                p0.x = p1.x;
                p1.x = tmpP.x;
            }
            this.dir = p1.subtract(p0);
            let l = this.dir.length();
            this.dir.scaleInPlace(1 / l);
            p0.subtractInPlace(this.dir.scale(0.007));
            p1.addInPlace(this.dir.scale(0.03));
            this.dir = p1.subtract(p0);
            l = this.dir.length();
            this.dir.scaleInPlace(1 / l);
            let n = Mummu.Rotate(this.dir, BABYLON.Axis.Z, this.mirrorX ? -Math.PI * 0.5 : Math.PI * 0.5);
            let shieldWireR = new MarbleRunSimulatorCore.Wire(this);
            shieldWireR.colorIndex = 3;
            shieldWireR.path = [p0.clone().addInPlaceFromFloats(0, 0, -0.012).addInPlace(this.dir.scale(0.04)).addInPlace(n.scale(0.01)), p0.clone().addInPlaceFromFloats(0, 0, -0.012).addInPlace(this.dir.scale(-0.02)).addInPlace(n.scale(0.01))];
            this.wires.push(shieldWireR);
            let shieldWireL = new MarbleRunSimulatorCore.Wire(this);
            shieldWireL.colorIndex = 3;
            shieldWireL.path = [p0.clone().addInPlaceFromFloats(0, 0, 0.012).addInPlace(this.dir.scale(0.04)).addInPlace(n.scale(0.01)), p0.clone().addInPlaceFromFloats(0, 0, 0.012).addInPlace(this.dir.scale(-0.02)).addInPlace(n.scale(0.01))];
            this.wires.push(shieldWireL);
            let shieldConnector = new BABYLON.Mesh("shieldConnector");
            this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/uConnector.babylon").then((datas) => {
                let data = Mummu.CloneVertexData(datas[0]);
                Mummu.ScaleVertexDataInPlace(data, 0.024);
                data.applyToMesh(shieldConnector);
            });
            shieldConnector.position.copyFrom(p0).addInPlace(n.scale(0.01));
            shieldConnector.rotationQuaternion = Mummu.QuaternionFromYZAxis(n, this.dir);
            shieldConnector.parent = this;
            shieldConnector.material = this.game.materials.getMetalMaterial(this.getColor(4));
            if (this.h / this.w > 4) {
                let shieldWireUpR = new MarbleRunSimulatorCore.Wire(this);
                shieldWireUpR.colorIndex = 3;
                shieldWireUpR.path = [p0.clone().addInPlaceFromFloats(0, 0, -0.0165).addInPlace(this.dir.scale(0.03)).addInPlace(n.scale(0.022)), p0.clone().addInPlaceFromFloats(0, 0, -0.0165).addInPlace(this.dir.scale(-0.033)).addInPlace(n.scale(0.022))];
                this.wires.push(shieldWireUpR);
                let shieldWireUpL = new MarbleRunSimulatorCore.Wire(this);
                shieldWireUpL.colorIndex = 3;
                shieldWireUpL.path = [p0.clone().addInPlaceFromFloats(0, 0, 0.0165).addInPlace(this.dir.scale(0.03)).addInPlace(n.scale(0.022)), p0.clone().addInPlaceFromFloats(0, 0, 0.0165).addInPlace(this.dir.scale(-0.03)).addInPlace(n.scale(0.022))];
                this.wires.push(shieldWireUpL);
                let shieldConnectorUp = new BABYLON.Mesh("shieldConnectorUp");
                this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/uConnector.babylon").then((datas) => {
                    let data = Mummu.CloneVertexData(datas[0]);
                    Mummu.ScaleVertexDataInPlace(data, 0.033);
                    data.applyToMesh(shieldConnectorUp);
                });
                shieldConnectorUp.position.copyFrom(p0).addInPlace(this.dir.scale(-0.01)).addInPlace(n.scale(0.022));
                shieldConnectorUp.rotationQuaternion = Mummu.QuaternionFromYZAxis(n, this.dir);
                shieldConnectorUp.parent = this;
                shieldConnectorUp.material = this.game.materials.getMetalMaterial(this.getColor(4));
            }
            this.box = new BABYLON.Mesh("box");
            this.screwWire = new MarbleRunSimulatorCore.Wire(this);
            this.screwWire.colorIndex = 1;
            this.screwWire.wireSize = 0.003;
            this.screwWire.parent = this.box;
            this.screwWire.path = [];
            for (let t = 0; t <= l; t += 0.001) {
                let a = (t / period) * Math.PI * 2;
                let point = new BABYLON.Vector3(t, Math.cos(a) * r, Math.sin(a) * r);
                this.screwWire.path.push(point);
            }
            this.wires.push(this.screwWire);
            this.box.position.copyFrom(p0);
            this.box.position.addInPlace(n.scale(0.021));
            this.box.rotationQuaternion = Mummu.QuaternionFromXYAxis(this.dir, BABYLON.Axis.Y);
            this.box.parent = this;
            let tip = BABYLON.MeshBuilder.CreateCylinder("tip", { height: 0.004, diameter: 0.04 });
            this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/wheel.babylon").then((datas) => {
                let data = Mummu.CloneVertexData(datas[1]);
                Mummu.ScaleVertexDataInPlace(data, 1.05);
                data.applyToMesh(tip);
            });
            tip.position.x = l;
            tip.rotation.y = Math.PI * 0.5;
            tip.parent = this.box;
            tip.material = this.game.materials.getMetalMaterial(this.getColor(2));
            this.generateWires();
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }
        static GenerateTemplate(w, h, mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            if (isNaN(h)) {
                debugger;
            }
            template.partName = "screw-" + w.toFixed(0) + "." + h.toFixed(0);
            template.h = h;
            template.w = w;
            template.mirrorX = mirrorX;
            template.xExtendable = true;
            template.yExtendable = true;
            template.xMirrorable = true;
            let p0 = new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0);
            p0.x += 0.03;
            p0.y -= 0.005;
            let p1 = new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * (template.w - 0.5), 0, -MarbleRunSimulatorCore.tileDepth * (template.d - 1));
            p1.x -= 0.03;
            p1.y += 0.005;
            let dir = p1.subtract(p0).normalize();
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], p0, dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], p1, dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * (template.w - 0.5), 0, -MarbleRunSimulatorCore.tileDepth * (template.d - 1)), MarbleRunSimulatorCore.Tools.V3Dir(90)),
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
            let dA = this.speed * dt * this.game.currentTimeFactor;
            let x = 1;
            if (this.mirrorX) {
                x = -1;
            }
            this.a = this.a + dA;
            while (this.a > 2 * Math.PI) {
                this.a -= 2 * Math.PI;
            }
            this.box.rotate(BABYLON.Axis.X, -dA);
            this.box.freezeWorldMatrix();
            this.box.getChildMeshes().forEach((child) => {
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
            };
            this.shieldClose = false;
            this.currentShootState = 0;
            this.shieldSpeed = 0.15;
            this.delayTimeout = 0;
            prop.h = Nabu.MinMax(prop.h, 4, 22);
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
                    this.kicker.material = this.game.materials.leatherMaterial;
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
            this.kickerYIdle = -MarbleRunSimulatorCore.tileHeight * (this.h - 2) - dH - cupR * 0.8 - 0.004;
            this.kicker.parent = this;
            this.kicker.position.copyFromFloats(x * MarbleRunSimulatorCore.tileWidth * 0.4 - 0, this.kickerYIdle, 0);
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
            this.shieldYClosed = -MarbleRunSimulatorCore.tileHeight * (this.h - 2);
            this.shield.position.copyFromFloats(x * MarbleRunSimulatorCore.tileWidth * 0.4 - 0, this.shieldYClosed, 0);
            if (this.mirrorX) {
                this.shield.rotation.y = Math.PI;
            }
            this.shield.parent = this;
            this.base.position.copyFromFloats(x * MarbleRunSimulatorCore.tileWidth * 0.4 - 0, this.shieldYClosed - 0.02, 0);
            if (this.mirrorX) {
                this.base.rotation.y = Math.PI;
            }
            this.base.parent = this;
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
            this.animateKickerArm = Mummu.AnimationFactory.CreateNumber(this, this.kicker.position, "y", () => {
                this._freezeKicker();
            }, false, Nabu.Easing.easeOutCubic);
            this.animateKickerKick = Mummu.AnimationFactory.CreateNumber(this, this.kicker.position, "y", () => {
                this._freezeKicker();
            }, false, Nabu.Easing.easeOutElastic);
            console.log("alpha");
        }
        static GenerateTemplate(h, mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
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
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * (h - 2), 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 - 1.6 * cupR, -MarbleRunSimulatorCore.tileHeight * (h - 2) - dH, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 - 0, -MarbleRunSimulatorCore.tileHeight * (h - 2) - dH - cupR * 0.8, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 + cupR, -MarbleRunSimulatorCore.tileHeight * (h - 2) - dH, 0), n),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 + cupR, -MarbleRunSimulatorCore.tileHeight, 0), n),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 + cupR - 0.015, 0.035 - MarbleRunSimulatorCore.tileHeight, 0), new BABYLON.Vector3(-1, 1, 0).normalize(), new BABYLON.Vector3(-1, -1, 0).normalize()),
            ];
            template.trackTemplates[0].drawEndTip = true;
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight, 0), dirLeft),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.4 + cupR - 0.02, -MarbleRunSimulatorCore.tileHeight * 0.6, 0), dirRight)
            ];
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
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
        getBallArmed() {
            let center = new BABYLON.Vector3(0.0301 * (this.mirrorX ? -1 : 1), -MarbleRunSimulatorCore.tileHeight * (this.h - 2) - 0.0004, 0);
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
        update(dt) {
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
            let center = new BABYLON.Vector3(0.0301, -MarbleRunSimulatorCore.tileHeight * (this.h - 2) - 0.0004, 0);
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
                this.animateKickerArm(this.kickerYIdle - this.kickerLength, 1.5 / this.game.currentTimeFactor).then(() => {
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
                    ballArmed.velocity.copyFromFloats(0, this.velocityKick, 0);
                    this.currentShootState = 4;
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
                this.animateKickerKick(this.kickerYIdle, 0.8 / this.game.currentTimeFactor).then(() => {
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
    MarbleRunSimulatorCore.Shooter = Shooter;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Snake extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            prop.w = Math.max(prop.w, 2);
            let partName = "snake-" + prop.w.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }
        static GenerateTemplate(w = 1, mirrorZ) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "snake-" + w.toFixed(0);
            template.angleSmoothSteps = 40;
            template.maxAngle = Math.PI / 8;
            template.w = w;
            template.h = 0;
            template.d = 3;
            template.mirrorZ = mirrorZ;
            template.xExtendable = true;
            template.zMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let count = 3 * template.w;
            if (count % 2 === 1) {
                count--;
            }
            let l = MarbleRunSimulatorCore.tileWidth * template.w;
            let r = l / count;
            let r2 = r / Math.SQRT2 * 1.0;
            let r12 = r - r2;
            let z0 = -MarbleRunSimulatorCore.tileDepth * Math.floor(template.d / 2);
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            let start = new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, z0);
            let end = new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * (template.w - 0.5), 0, z0);
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
                w: w,
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
/// <reference path="../machine/MachinePart.ts"/>
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Spiral extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            prop.w = Nabu.MinMax(prop.w, 1, 2);
            let partName = "spiral-" + prop.w.toFixed(0) + "." + prop.h.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }
        static GenerateTemplate(w, h, mirrorX, mirrorZ) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "spiral-" + w.toFixed(0) + "." + h.toFixed(0);
            template.angleSmoothSteps = 200;
            template.w = w;
            template.d = w === 1 ? 2 : 3;
            template.h = h;
            template.n = h;
            template.mirrorX = mirrorX;
            template.mirrorZ = mirrorZ;
            template.xExtendable = true;
            template.yExtendable = true;
            template.xMirrorable = true;
            template.zMirrorable = true;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            //template.trackTemplates[0].preferedStartBank = - Math.PI / 10 * (template.mirrorX ? - 1 : 1);
            //template.trackTemplates[0].preferedEndBank = - Math.PI / 10 * (template.mirrorX ? - 1 : 1);
            template.trackTemplates[0].onNormalEvaluated = (n) => {
                n.copyFromFloats(0, 1, 0);
            };
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90))];
            let nSpirals = template.n;
            let widthInM = template.w * MarbleRunSimulatorCore.tileWidth;
            let r = widthInM * 0.5 - 0.01;
            let heightStart = 0;
            let heightEnd = -MarbleRunSimulatorCore.tileHeight * template.h;
            for (let nS = 0; nS < nSpirals; nS++) {
                let x = -MarbleRunSimulatorCore.tileWidth * 0.5 + template.w * MarbleRunSimulatorCore.tileWidth * 0.5;
                let nV0 = 0;
                if (nS >= 1) {
                    nV0 = 1;
                }
                for (let nV = nV0; nV <= 8; nV++) {
                    let f = ((nS * 8) + nV) / (nSpirals * 8);
                    let a = (2 * Math.PI * nV) / 8;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);
                    let dir;
                    if (nV === 0 || nV === 8) {
                        dir = BABYLON.Vector3.Right();
                    }
                    template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + sina * r, f * (heightEnd - heightStart) + heightStart, -r + cosa * r), dir));
                }
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * (template.w - 0.5), heightEnd, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)));
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
    MarbleRunSimulatorCore.Spiral = Spiral;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Split extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this._animatePivot = Mummu.AnimationFactory.EmptyNumberCallback;
            this.reset = () => {
                this._moving = false;
                if (this.mirrorX) {
                    this.pivot.rotation.z = -Math.PI / 4;
                }
                else {
                    this.pivot.rotation.z = Math.PI / 4;
                }
                this.pivot.freezeWorldMatrix();
                this.pivot.getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
            };
            this._moving = false;
            let partName = "split";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            this.clicSound = new BABYLON.Sound("clic-sound", "./datas/sounds/clic.wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.clicSound.setVolume(0.25);
            for (let i = this.colors.length; i < 6; i++) {
                this.colors[i] = 0;
            }
            let rCurb = Split.pivotL * 0.3;
            let anchorDatas = [];
            let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.001, diameter: 0.01 });
            let q = BABYLON.Quaternion.Identity();
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, 0.015));
            anchorDatas.push(tmpVertexData);
            let axisZMin = -this.wireGauge * 0.6;
            let axisZMax = 0.015 - 0.001 * 0.5;
            tmpVertexData = BABYLON.CreateCylinderVertexData({ height: axisZMax - axisZMin, diameter: 0.001 });
            Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), q);
            Mummu.RotateVertexDataInPlace(tmpVertexData, q);
            Mummu.TranslateVertexDataInPlace(tmpVertexData, new BABYLON.Vector3(0, 0, (axisZMax + axisZMin) * 0.5));
            anchorDatas.push(tmpVertexData);
            let anchor = new BABYLON.Mesh("anchor");
            anchor.position.copyFromFloats(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            anchor.parent = this;
            anchor.material = this.game.materials.getMetalMaterial(this.getColor(4));
            Mummu.MergeVertexDatas(...anchorDatas).applyToMesh(anchor);
            this.pivot = new BABYLON.Mesh("pivot");
            this.pivot.position.copyFromFloats(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            this.pivot.material = this.game.materials.getMetalMaterial(this.getColor(4));
            this.pivot.parent = this;
            let dz = this.wireGauge * 0.5;
            this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/splitter-arrow.babylon").then((datas) => {
                if (datas[0]) {
                    let data = Mummu.CloneVertexData(datas[0]);
                    Mummu.TranslateVertexDataInPlace(data, new BABYLON.Vector3(0, 0, axisZMin));
                    data.applyToMesh(this.pivot);
                }
            });
            let wireHorizontal0 = new MarbleRunSimulatorCore.Wire(this);
            wireHorizontal0.colorIndex = 5;
            wireHorizontal0.parent = this.pivot;
            wireHorizontal0.path = [new BABYLON.Vector3(-Split.pivotL, 0, -dz), new BABYLON.Vector3(Split.pivotL, 0, -dz)];
            let wireHorizontal1 = new MarbleRunSimulatorCore.Wire(this);
            wireHorizontal1.colorIndex = 5;
            wireHorizontal1.parent = this.pivot;
            wireHorizontal1.path = [new BABYLON.Vector3(-Split.pivotL, 0, dz), new BABYLON.Vector3(Split.pivotL, 0, dz)];
            let wireVertical0 = new MarbleRunSimulatorCore.Wire(this);
            wireVertical0.colorIndex = 5;
            wireVertical0.parent = this.pivot;
            wireVertical0.path = [new BABYLON.Vector3(0, Split.pivotL, -dz), new BABYLON.Vector3(0, rCurb * 0.3, -dz)];
            let wireVertical1 = new MarbleRunSimulatorCore.Wire(this);
            wireVertical1.colorIndex = 5;
            wireVertical1.parent = this.pivot;
            wireVertical1.path = [new BABYLON.Vector3(0, Split.pivotL, dz), new BABYLON.Vector3(0, rCurb * 0.3, dz)];
            let curbLeft0 = new MarbleRunSimulatorCore.Wire(this);
            curbLeft0.colorIndex = 5;
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
            curbLeft1.colorIndex = 5;
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
            curbRight0.colorIndex = 5;
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
            curbRight1.colorIndex = 5;
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
                    this.pivot.rotation.z = Math.PI / 4;
                }
                this.pivot.freezeWorldMatrix();
                this.pivot.getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
                this.wires.forEach((wire) => {
                    wire.recomputeAbsolutePath();
                });
            }, false, Nabu.Easing.easeInSquare);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "split";
            template.w = 1;
            template.h = 1;
            template.mirrorX = mirrorX;
            template.xMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let pEndLeft = new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            pEndLeft.x -= Split.pivotL / Math.SQRT2;
            pEndLeft.y += Split.pivotL / Math.SQRT2;
            let pEndRight = new BABYLON.Vector3(0, -MarbleRunSimulatorCore.tileHeight * 0.5, 0);
            pEndRight.x += Split.pivotL / Math.SQRT2;
            pEndRight.y += Split.pivotL / Math.SQRT2;
            let dirEnd = MarbleRunSimulatorCore.Tools.V3Dir(135);
            let nEnd = MarbleRunSimulatorCore.Tools.V3Dir(45);
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], pEndLeft.subtract(dirEnd.scale(0.001)), dirEnd)
            ];
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 2;
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-Split.pivotL / Math.SQRT2, -MarbleRunSimulatorCore.tileHeight * 0.5 - Split.pivotL / Math.SQRT2 - 0.001, 0), dirEnd.multiplyByFloats(1, -1, 1))
            ];
            template.trackTemplates[2] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 3;
            template.trackTemplates[2].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(Split.pivotL / Math.SQRT2, -MarbleRunSimulatorCore.tileHeight * 0.5 - Split.pivotL / Math.SQRT2 - 0.001, 0), dirEnd),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0), dir)
            ];
            template.trackTemplates[3] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[3].colorIndex = 1;
            template.trackTemplates[3].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir.multiplyByFloats(-1, 1, 1)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[3], pEndRight.subtract(dirEnd.scale(0.001).multiplyByFloats(-1, 1, 1)), dirEnd.multiplyByFloats(-1, 1, 1))
            ];
            template.trackTemplates[4] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[4].colorIndex = 4;
            template.trackTemplates[4].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.25, 0.016, 0), MarbleRunSimulatorCore.Tools.V3Dir(100), new BABYLON.Vector3(0, -1, 0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(0, 0.005, 0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[4], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.25, 0.016, 0), MarbleRunSimulatorCore.Tools.V3Dir(80), new BABYLON.Vector3(0, -1, 0)),
            ];
            template.trackTemplates[4].drawStartTip = true;
            template.trackTemplates[4].drawEndTip = true;
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
            if (!this._moving) {
                for (let i = 0; i < this.machine.balls.length; i++) {
                    let ball = this.machine.balls[i];
                    if (BABYLON.Vector3.Distance(ball.position, this.pivot.absolutePosition) < 0.05) {
                        let local = BABYLON.Vector3.TransformCoordinates(ball.position, this.pivot.getWorldMatrix().clone().invert());
                        if (local.y < ball.radius * 0.9) {
                            if (local.x > ball.radius * 0.5 && local.x < Split.pivotL) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(-Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
                                        this.clicSound.play();
                                        this._moving = false;
                                    });
                                }, 150 / this.game.currentTimeFactor);
                                return;
                            }
                            else if (local.x > -Split.pivotL && local.x < -ball.radius * 0.5) {
                                this._moving = true;
                                setTimeout(() => {
                                    this._animatePivot(Math.PI / 4, 0.3 / this.game.currentTimeFactor).then(() => {
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
    Split.pivotL = 0.013;
    MarbleRunSimulatorCore.Split = Split;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Stairway extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            this.boxesCount = 4;
            this.boxes = [];
            this.bielles = [];
            this.x0 = 0;
            this.x1 = 0;
            this.stepW = 0;
            this.y0 = 0;
            this.y1 = 0;
            this.stepH = 0;
            this.dH = 0.002;
            this.reset = () => {
                for (let i = 0; i < this.boxesCount; i++) {
                    this.a = 0;
                    this.update(0);
                    requestAnimationFrame(() => {
                        this.update(0);
                    });
                }
            };
            this.l = 0;
            this.p = 0;
            this.speed = Math.PI; // in m/s
            this.a = 0;
            let partName = "stairway-" + prop.w.toFixed(0) + "." + prop.h.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            for (let i = this.colors.length; i < 4; i++) {
                this.colors[i] = 0;
            }
            let x = 1;
            if (prop.mirrorX) {
                x = -1;
            }
            this.x0 = -MarbleRunSimulatorCore.tileWidth * 0.3;
            this.x1 = MarbleRunSimulatorCore.tileWidth * 0.3 + (this.w - 1) * MarbleRunSimulatorCore.tileWidth;
            this.boxesCount = Math.round((this.x1 - this.x0) / 0.02);
            this.stepW = (this.x1 - this.x0) / this.boxesCount;
            this.y0 = -MarbleRunSimulatorCore.tileHeight * (this.h - 2 + 0.05) - 0.005;
            this.y1 = MarbleRunSimulatorCore.tileHeight * 0.05 + 0.005;
            if (prop.mirrorX) {
                let yT = this.y0;
                this.y0 = this.y1;
                this.y1 = yT;
            }
            this.stepH = Math.abs((this.y1 - this.y0) / this.boxesCount);
            for (let i = 0; i < this.boxesCount; i++) {
                let data = Stairway.MakeStairwayColliderVertexData(this.stepW, this.stepH * 2, 0.02, this.dH, 0.001);
                let box = new BABYLON.Mesh("collider-" + i);
                box.isVisible = false;
                data.applyToMesh(box);
                if (this.mirrorX) {
                    box.rotation.y = Math.PI;
                }
                box.parent = this;
                let fX = i / this.boxesCount;
                box.position.x = (1 - fX) * this.x0 + fX * this.x1 + this.stepW * 0.5;
                let fY = (i + 0.5) / this.boxesCount;
                box.position.y = (1 - fY) * this.y0 + fY * this.y1 - this.stepH;
                let l = box.position.y - -MarbleRunSimulatorCore.tileHeight * (this.h - 2 + 1.5) + this.stepH - 0.002;
                let bielle = new BABYLON.Mesh("bielle");
                bielle.material = this.game.materials.getMetalMaterial(this.getColor(2));
                this.bielles[i] = bielle;
                this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/stairway-bielle.babylon").then((vertexDatas) => {
                    let vertexData = vertexDatas[0];
                    if (vertexData) {
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
                        vertexData.applyToMesh(bielle);
                    }
                });
                this.boxes[i] = box;
                let displayMesh = new BABYLON.Mesh("display-box-" + i);
                displayMesh.material = this.game.materials.getMetalMaterial(this.getColor(1));
                this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/stairway-step.babylon").then((vertexDatas) => {
                    let vertexData = vertexDatas[0];
                    if (vertexData) {
                        vertexData = Mummu.CloneVertexData(vertexData);
                        let positions = vertexData.positions;
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
                        vertexData.positions = positions;
                        vertexData.applyToMesh(displayMesh);
                        displayMesh.parent = box;
                    }
                });
            }
            this.vil = new BABYLON.Mesh("display-vil");
            this.vil.material = this.game.materials.getMetalMaterial(this.getColor(3));
            this.vil.position.y = -MarbleRunSimulatorCore.tileHeight * (this.h - 2 + 1.5);
            this.vil.parent = this;
            this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/stairway-vil.babylon").then((vertexDatas) => {
                let vertexData = vertexDatas[0];
                if (vertexData) {
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
                            positions[3 * p + 1] += this.stepH * 0.5;
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
                    this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/wheel.babylon").then((datas) => {
                        let wheel0Data = Mummu.CloneVertexData(datas[1]);
                        //Mummu.ScaleVertexDataInPlace(wheel0Data, 0.03);
                        Mummu.RotateVertexDataInPlace(wheel0Data, BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI * 0.5));
                        Mummu.TranslateVertexDataInPlace(wheel0Data, new BABYLON.Vector3(this.x0 - 0.001, 0, 0));
                        let wheel1Data = Mummu.CloneVertexData(datas[1]);
                        //Mummu.ScaleVertexDataInPlace(wheel1Data, 0.03);
                        Mummu.RotateVertexDataInPlace(wheel1Data, BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI * 0.5));
                        Mummu.TranslateVertexDataInPlace(wheel1Data, new BABYLON.Vector3(this.x1 + 0.001, 0, 0));
                        Mummu.MergeVertexDatas(...vilPartsDatas, wheel0Data, wheel1Data).applyToMesh(this.vil);
                    });
                }
            });
            this.generateWires();
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
        static GenerateTemplate(w, h, mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            if (isNaN(h)) {
                debugger;
            }
            template.partName = "stairway-" + w.toFixed(0) + "." + h.toFixed(0);
            template.h = h;
            template.w = w;
            template.mirrorX = mirrorX;
            template.xExtendable = true;
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
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * (h - 2), 0), dir), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.3, -MarbleRunSimulatorCore.tileHeight * (h - 2 + 0.05), 0), dir)];
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3((template.w - 1) * MarbleRunSimulatorCore.tileWidth + MarbleRunSimulatorCore.tileWidth * 0.3, MarbleRunSimulatorCore.tileHeight * 0.05 - 0.02, 0), MarbleRunSimulatorCore.Tools.V3Dir(0), MarbleRunSimulatorCore.Tools.V3Dir(-90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3((template.w - 1) * MarbleRunSimulatorCore.tileWidth + MarbleRunSimulatorCore.tileWidth * 0.3, MarbleRunSimulatorCore.tileHeight * 0.05 - 0.003, 0), MarbleRunSimulatorCore.Tools.V3Dir(0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3((template.w - 1) * MarbleRunSimulatorCore.tileWidth + MarbleRunSimulatorCore.tileWidth * 0.3 + 0.003, MarbleRunSimulatorCore.tileHeight * 0.05, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3((template.w - 1) * MarbleRunSimulatorCore.tileWidth + MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90)),
            ];
            template.trackTemplates[1].drawStartTip = true;
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
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
            let dA = this.speed * dt * this.game.currentTimeFactor;
            let x = 1;
            if (this.mirrorX) {
                x = -1;
            }
            this.a = this.a + dA;
            while (this.a > 2 * Math.PI) {
                this.a -= 2 * Math.PI;
            }
            this.vil.rotation.x = this.a;
            this.vil.freezeWorldMatrix();
            for (let i = 0; i < this.boxes.length; i++) {
                let a = this.a;
                if (i % 2 === 1) {
                    a += Math.PI;
                }
                let box = this.boxes[i];
                let fY = (i + 0.5) / this.boxesCount;
                box.position.y = (1 - fY) * this.y0 + fY * this.y1 - this.stepH - this.dH * 0.5;
                box.position.y += Math.cos(a) * (this.stepH * 0.5 + this.dH * 0.5);
                this.boxes[i].freezeWorldMatrix();
                this.boxes[i].getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
                this.bielles[i].position.copyFrom(this.vil.absolutePosition);
                let fX = i / this.boxesCount;
                this.bielles[i].position.x += (1 - fX) * this.x0 + fX * this.x1 + this.stepW * 0.5;
                this.bielles[i].position.y += Math.cos(a) * this.stepH * 0.5;
                this.bielles[i].position.z += Math.sin(a) * this.stepH * 0.5;
                let dir = this.boxes[i].absolutePosition.subtract(this.bielles[i].position).addInPlaceFromFloats(0, +this.stepH - 0.002, 0);
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
            let partName = "start";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            this.generateWires();
        }
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "start";
            template.mirrorX = mirrorX;
            template.xMirrorable = true;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.3, 0.008, 0), MarbleRunSimulatorCore.Tools.V3Dir(120)), new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), MarbleRunSimulatorCore.Tools.V3Dir(90))];
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
    class UTurn extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            let partName = "uturn-" + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }
        static GenerateTemplate(h, d, mirrorX, mirrorZ) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "uturn-" + h.toFixed(0) + "." + d.toFixed(0);
            template.angleSmoothSteps = 50;
            template.w = d - 1;
            if (d >= 8) {
                template.w = d - 2;
            }
            template.h = h;
            template.d = d;
            template.mirrorX = mirrorX;
            template.mirrorZ = mirrorZ;
            template.yExtendable = true;
            template.zExtendable = true;
            template.minD = 2;
            template.xMirrorable = true;
            template.zMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let r = MarbleRunSimulatorCore.tileDepth * (d - 1) * 0.5;
            let x0 = -MarbleRunSimulatorCore.tileWidth * 0.5 + (2 * Math.PI * r) / 6;
            let r2 = r / Math.SQRT2;
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), new BABYLON.Vector3(1, 0, 0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + 0, 0, 0)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r2, 0, -r + r2)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r, 0, -r)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r2, 0, -r - r2)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + 0, 0, -2 * r)),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, -2 * r), new BABYLON.Vector3(-1, 0, 0)),
            ];
            for (let n = 0; n < template.trackTemplates[0].trackpoints.length; n++) {
                let f = n / (template.trackTemplates[0].trackpoints.length - 1);
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
    MarbleRunSimulatorCore.UTurn = UTurn;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class UTurnSharp extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            let partName = "uturnsharp";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            for (let i = this.colors.length; i < 2; i++) {
                this.colors[i] = 0;
            }
            this.generateWires();
        }
        static GenerateTemplate(mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "uturnsharp";
            template.w = 1;
            template.h = 1;
            template.mirrorX = mirrorX;
            template.xMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            let endAngle = 120;
            let dirJoin = MarbleRunSimulatorCore.Tools.V3Dir(endAngle);
            let nJoin = MarbleRunSimulatorCore.Tools.V3Dir(endAngle - 90);
            let pEnd = new BABYLON.Vector3(-0.01, -MarbleRunSimulatorCore.tileHeight * 0.3, 0);
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0), dir),
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], pEnd, dirJoin)
            ];
            template.trackTemplates[1] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.4, 0.014, 0), MarbleRunSimulatorCore.Tools.V3Dir(90), MarbleRunSimulatorCore.Tools.V3Dir(180)),
            ];
            let a0 = (endAngle - 90) / 180 * Math.PI;
            for (let a = 0; a <= 4; a++) {
                let f = a / 4;
                let angle = a0 * (1 - f) + Math.PI * f;
                let r = 0.014 * (1 - f) + MarbleRunSimulatorCore.tileHeight * 0.7 * f;
                let cosa = Math.cos(angle);
                let sina = Math.sin(angle);
                let p = pEnd.clone();
                p.x += sina * r;
                p.y += cosa * r;
                template.trackTemplates[1].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], p));
            }
            template.trackTemplates[1].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -MarbleRunSimulatorCore.tileHeight * template.h, 0), dir.scale(-1), new BABYLON.Vector3(0, 1, 0)));
            template.trackTemplates[1].drawStartTip = true;
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.UTurnSharp = UTurnSharp;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Wall extends MarbleRunSimulatorCore.MachinePart {
        constructor(machine, prop) {
            super(machine, prop);
            let partName = "wall-" + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            this.generateWires();
        }
        static GenerateTemplate(h, d, mirrorX) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "wall-" + h.toFixed(0) + "." + d.toFixed(0);
            template.angleSmoothSteps = 100;
            template.maxAngle = (0.8 * Math.PI) / 2;
            template.minTurnRadius = 0.12;
            template.w = 2;
            template.h = h;
            template.minH = 3;
            template.d = d;
            template.minD = 3;
            template.mirrorX = mirrorX;
            template.yExtendable = true;
            template.zExtendable = true;
            template.xMirrorable = true;
            let r = MarbleRunSimulatorCore.tileWidth;
            let rY = template.h * MarbleRunSimulatorCore.tileHeight * 0.5;
            let depthStart = 0;
            let depthEnd = -MarbleRunSimulatorCore.tileDepth * (template.d - 1);
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -template.h * MarbleRunSimulatorCore.tileHeight, 0), MarbleRunSimulatorCore.Tools.V3Dir(90))];
            for (let n = 0; n <= 8; n++) {
                let f = n / 8;
                let cosa = Math.cos(2 * Math.PI * f);
                let sina = Math.sin(Math.PI * f);
                template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-(1 - sina) * r + r, (1 - cosa) * rY - template.h * MarbleRunSimulatorCore.tileHeight, Nabu.Easing.easeInOutSine(Nabu.Easing.easeInOutSine(f)) * (depthEnd - depthStart) + depthStart), undefined, n === 4 ? MarbleRunSimulatorCore.Tools.V3Dir(Math.PI) : undefined));
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, -template.h * MarbleRunSimulatorCore.tileHeight, -MarbleRunSimulatorCore.tileDepth * (template.d - 1)), MarbleRunSimulatorCore.Tools.V3Dir(-90)));
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
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            template.initialize();
            return template;
        }
    }
    MarbleRunSimulatorCore.Wall = Wall;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Wave extends MarbleRunSimulatorCore.MachinePartWithOriginDestination {
        constructor(machine, prop) {
            super(machine, prop);
            let partName = "wave-" + prop.w.toFixed(0) + "." + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }
        static GenerateTemplate(w = 1, h = 1, d = 1, mirrorX, mirrorZ) {
            let template = new MarbleRunSimulatorCore.MachinePartTemplate();
            template.partName = "wave-" + w.toFixed(0) + "." + h.toFixed(0) + "." + d.toFixed(0);
            template.w = w;
            template.h = h;
            template.d = d;
            template.mirrorX = mirrorX;
            template.mirrorZ = mirrorZ;
            template.xExtendable = true;
            template.yExtendable = true;
            template.zExtendable = true;
            template.xMirrorable = true;
            template.zMirrorable = true;
            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();
            template.trackTemplates[0] = new MarbleRunSimulatorCore.TrackTemplate(template);
            let start = new BABYLON.Vector3(-MarbleRunSimulatorCore.tileWidth * 0.5, 0, 0);
            let end = new BABYLON.Vector3(MarbleRunSimulatorCore.tileWidth * (template.w - 0.5), -MarbleRunSimulatorCore.tileHeight * template.h, -MarbleRunSimulatorCore.tileDepth * (template.d - 1));
            let tanVector = dir.scale(BABYLON.Vector3.Distance(start, end));
            template.trackTemplates[0].trackpoints = [new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], start, dir, undefined, undefined, 1)];
            for (let i = 1; i < (w + 1); i++) {
                let p1 = BABYLON.Vector3.Hermite(start, tanVector, end, tanVector, i / (w + 1));
                if (i % 2 === 1) {
                    p1.y -= 0.008;
                }
                else {
                    p1.y += 0.008;
                }
                template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], p1));
            }
            template.trackTemplates[0].trackpoints.push(new MarbleRunSimulatorCore.TrackPoint(template.trackTemplates[0], end, dir, undefined, 1));
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
            return new Wave(machine, {
                i: i,
                j: j,
                k: k,
                w: w,
                h: h,
                d: d,
                c: this.colors,
                mirrorX: mirrorX,
                mirrorZ: mirrorZ,
            });
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
            let note = new BABYLON.Sound("note-" + index, "./datas/sounds/notes/" + QuarterNote.NoteNames[index] + ".mp3", this.getScene(), undefined, { loop: false, autoplay: false });
            this.notes.push(note);
            let tile = BABYLON.MeshBuilder.CreateBox("tile", { width: 0.015, height: 0.005, depth: 0.06 });
            tile.material = this.game.materials.getMetalMaterial(0);
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
            let note = new BABYLON.Sound("note-" + index, "./datas/sounds/notes/" + QuarterNote.NoteNames[index] + ".mp3", this.getScene(), undefined, { loop: false, autoplay: false });
            this.notes.push(note);
            let tile = BABYLON.MeshBuilder.CreateBox("tile", { width: 0.015, height: 0.005, depth: 0.06 });
            tile.material = this.game.materials.getMetalMaterial(0);
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
            let note2 = new BABYLON.Sound("note-" + index, "./datas/sounds/notes/" + QuarterNote.NoteNames[index] + ".mp3", this.getScene(), undefined, { loop: false, autoplay: false });
            this.notes.push(note2);
            let tile2 = BABYLON.MeshBuilder.CreateBox("tile2", { width: 0.015, height: 0.005, depth: 0.06 });
            tile2.material = this.game.materials.getMetalMaterial(0);
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
    class Painting extends BABYLON.Mesh {
        constructor(room, paintingName, size = 0.5) {
            super("painting-" + paintingName);
            this.room = room;
            this.paintingName = paintingName;
            this.size = size;
            this.layerMask = 0x10000000;
        }
        async instantiate() {
            let vertexDatas = await this.room.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/paint-support.babylon");
            if (vertexDatas && vertexDatas[0]) {
                vertexDatas[0].applyToMesh(this);
            }
            if (vertexDatas && vertexDatas[1]) {
                let steel = new BABYLON.Mesh("steel");
                vertexDatas[1].applyToMesh(steel);
                steel.parent = this;
                steel.material = this.room.game.materials.getMetalMaterial(0);
                steel.layerMask = 0x10000000;
            }
            if (vertexDatas && vertexDatas[2]) {
                let lightedPlane = new BABYLON.Mesh("lighted-plane");
                vertexDatas[2].applyToMesh(lightedPlane);
                lightedPlane.parent = this;
                lightedPlane.material = this.room.game.materials.paintingLight;
                lightedPlane.layerMask = 0x10000000;
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
                        let body = BABYLON.MeshBuilder.CreateBox("paint-body", { width: wMesh + 0.04, height: hMesh + 0.04, depth: 0.04 });
                        body.layerMask = 0x10000000;
                        body.position.y = 1.2;
                        body.parent = this;
                        let plane = BABYLON.MeshBuilder.CreatePlane("paint", { width: wMesh, height: hMesh });
                        plane.layerMask = 0x10000000;
                        let mat = new BABYLON.StandardMaterial(this.name + "-material");
                        mat.diffuseTexture = texture;
                        mat.emissiveColor = new BABYLON.Color3(0.25, 0.25, 0.25);
                        plane.material = mat;
                        plane.position.y = 1.2;
                        plane.position.z = 0.021;
                        plane.rotation.y = Math.PI;
                        plane.parent = this;
                        resolve();
                    }
                    else {
                        requestAnimationFrame(checkTextureLoaded);
                    }
                };
                checkTextureLoaded();
            });
        }
    }
    MarbleRunSimulatorCore.Painting = Painting;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
var MarbleRunSimulatorCore;
(function (MarbleRunSimulatorCore) {
    class Room {
        constructor(game) {
            this.game = game;
            this.ground = new BABYLON.Mesh("room-ground");
            this.ground.layerMask = 0x10000000;
            this.ground.position.y = -2;
            this.ground.receiveShadows = true;
            let groundMaterial = new BABYLON.StandardMaterial("ground-material");
            groundMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/concrete.png");
            groundMaterial.diffuseColor = BABYLON.Color3.FromHexString("#3f4c52");
            groundMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.ground.material = groundMaterial;
            this.wall = new BABYLON.Mesh("room-wall");
            this.wall.layerMask = 0x10000000;
            this.wall.material = this.game.materials.whiteMaterial;
            this.wall.parent = this.ground;
            this.frame = new BABYLON.Mesh("room-frame");
            this.frame.layerMask = 0x10000000;
            this.frame.material = this.game.materials.getMetalMaterial(0);
            this.frame.parent = this.ground;
            this.light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 3, 0).normalize(), this.game.scene);
            this.light1.groundColor.copyFromFloats(0.3, 0.3, 0.3);
            this.light1.intensity = 0.2;
            this.light1.includeOnlyWithLayerMask = 0x10000000;
            this.light2 = new BABYLON.HemisphericLight("light2", new BABYLON.Vector3(-1, 3, 0).normalize(), this.game.scene);
            this.light2.groundColor.copyFromFloats(0.3, 0.3, 0.3);
            this.light2.intensity = 0.2;
            this.light2.includeOnlyWithLayerMask = 0x10000000;
        }
        async instantiate() {
            let vertexDatas = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/room.babylon");
            vertexDatas[0].applyToMesh(this.ground);
            vertexDatas[1].applyToMesh(this.wall);
            vertexDatas[2].applyToMesh(this.frame);
            let paintingNames = ["bilbao_1", "bilbao_2", "bilbao_3", "flower_1", "flower_2", "flower_3", "flower_4", "fort_william_1", "glasgow_1"];
            let n = 0;
            let randomPainting = () => {
                return paintingNames[n++];
            };
            let paint1 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
            paint1.instantiate();
            paint1.position.copyFromFloats(4, 0, 4);
            paint1.rotation.y = -0.75 * Math.PI;
            paint1.parent = this.ground;
            let paint11 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
            paint11.instantiate();
            paint11.position.copyFromFloats(2.8, 0, 4.5);
            paint11.rotation.y = -Math.PI;
            paint11.parent = this.ground;
            let paint2 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
            paint2.instantiate();
            paint2.position.copyFromFloats(4, 0, -4);
            paint2.rotation.y = -0.25 * Math.PI;
            paint2.parent = this.ground;
            let paint21 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
            paint21.instantiate();
            paint21.position.copyFromFloats(2.8, 0, -4.5);
            paint21.parent = this.ground;
            let paint3 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
            paint3.instantiate();
            paint3.position.copyFromFloats(-4, 0, -4);
            paint3.rotation.y = 0.25 * Math.PI;
            paint3.parent = this.ground;
            let paint31 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
            paint31.instantiate();
            paint31.position.copyFromFloats(-4.5, 0, -2.8);
            paint31.rotation.y = 0.5 * Math.PI;
            paint31.parent = this.ground;
            let paint32 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
            paint32.instantiate();
            paint32.position.copyFromFloats(-2.8, 0, -4.5);
            paint32.parent = this.ground;
            let paint4 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
            paint4.instantiate();
            paint4.position.copyFromFloats(-4, 0, 4);
            paint4.rotation.y = 0.75 * Math.PI;
            paint4.parent = this.ground;
            let paint41 = new MarbleRunSimulatorCore.Painting(this, randomPainting(), 0.8);
            paint41.instantiate();
            paint41.position.copyFromFloats(-2.8, 0, 4.5);
            paint41.rotation.y = Math.PI;
            paint41.parent = this.ground;
            let sculpt1 = new MarbleRunSimulatorCore.Sculpt(this, this.game.materials.getMetalMaterial(0));
            sculpt1.instantiate();
            sculpt1.position.copyFromFloats(4.5, 0, 0);
            sculpt1.rotation.y = -0.5 * Math.PI;
            sculpt1.parent = this.ground;
            let sculpt2 = new MarbleRunSimulatorCore.Sculpt(this, this.game.materials.getMetalMaterial(1));
            sculpt2.instantiate();
            sculpt2.position.copyFromFloats(-4.5, 0, 0);
            sculpt2.rotation.y = 0.5 * Math.PI;
            sculpt2.parent = this.ground;
            if (this.game.machine) {
                this.setGroundHeight(this.game.machine.baseMeshMinY - 0.8);
            }
        }
        setGroundHeight(h) {
            if (this.ground) {
                this.ground.position.y = h;
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
            this.layerMask = 0x10000000;
        }
        async instantiate() {
            let vertexDatas = await this.room.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/museum-stand-decoy.babylon");
            if (vertexDatas && vertexDatas[0]) {
                vertexDatas[0].applyToMesh(this);
            }
            if (vertexDatas && vertexDatas[1]) {
                let steel = new BABYLON.Mesh("steel");
                vertexDatas[1].applyToMesh(steel);
                steel.parent = this;
                steel.material = this.mat;
                steel.layerMask = 0x10000000;
            }
        }
    }
    MarbleRunSimulatorCore.Sculpt = Sculpt;
})(MarbleRunSimulatorCore || (MarbleRunSimulatorCore = {}));
