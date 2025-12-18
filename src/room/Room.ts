namespace MarbleRunSimulatorCore {
    
    export class RoomProp {

        public name: string;
        public hasPaintings: boolean;
        public hasSculptures: boolean;
        public wallColor: BABYLON.Color3;
        public groundColor: BABYLON.Color3;
        public isBlurred: boolean;
    }

    export interface IRoomDecor extends BABYLON.Mesh {
        h: number;
        setLayerMask(mask: number): void;
        getAllMeshes(): BABYLON.Mesh[];
    }

    export class Room {
        
        public skybox: BABYLON.Mesh;
        public skyboxMaterial: BABYLON.StandardMaterial;
        public ground: BABYLON.Mesh;
        public wall: BABYLON.Mesh;
        public ceiling: BABYLON.Mesh;
        public frame: BABYLON.Mesh;
        public decors: IRoomDecor[] = [];
        public light1: BABYLON.HemisphericLight;
        public light2: BABYLON.HemisphericLight;

        private _isBlurred: boolean = false;
        public get isBlurred(): boolean {
            return this._isBlurred;
        }
        public set isBlurred(v: boolean) {
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

        constructor(public machine: Machine, public game: IGame) {
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

        public onRoomJustInstantiated: () => void;

        private _currentRoomIndex: number = 0;
        public get currentRoomIndex(): number {
            return this._currentRoomIndex;
        }
        public async setRoomIndex(roomIndex: number, forceAndskipAnimation?: boolean): Promise<void> {
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
                    await this.instantiateSimple(groundColor, wallColor, 10);
                }
                else if (this._currentRoomIndex >= 2 && this._currentRoomIndex < 7) {
                    let f = (this._currentRoomIndex - 2) / 6;
                    let groundColor = BABYLON.Color3.FromHSV(Math.floor(f * 360), 0.4, 1);
                    let wallColor = BABYLON.Color3.FromHSV((Math.floor(f * 360) + 180) % 360, 0.4, 1);
                    console.log("GroundColor " + groundColor.toHexString());
                    console.log("WallColor " + wallColor.toHexString());
                    await this.instantiateSimple(groundColor.toColor4(), wallColor.toColor4(), 10);
                }
                else if (this._currentRoomIndex === 7) {
                    await this.instantiateMuseum(false, "./lib/marble-run-simulator-core/datas/skyboxes/icescape_low_res.png");
                }
                else if (this._currentRoomIndex === 8) {
                    let groundColor = BABYLON.Color4.FromHexString("#3F4C52FF");
                    let wallColor = BABYLON.Color4.FromHexString("#839099FF");
                    await this.instantiateSimple(groundColor, wallColor, 10);
                }
                else if (this._currentRoomIndex === 9) {
                    await this.instantiateOpenRoom(true, "./lib/marble-run-simulator-core/datas/skyboxes/sky.jpeg");
                }
                else if (this._currentRoomIndex === 10) {
                    let groundColor = BABYLON.Color4.FromHexString("#FFFFFFFF");
                    let wallColor = BABYLON.Color4.FromHexString("#FFFFFFFF");
                    await this.instantiateSimple(groundColor, wallColor, 10);
                }
                else if (this._currentRoomIndex === 11) {
                    let groundColor = BABYLON.Color4.FromHexString("#FFFFFFFF");
                    let wallColor = BABYLON.Color4.FromHexString("#FFFFFFFF");
                    await this.instantiateSimple(groundColor, wallColor, 10);
                }
                else if (this._currentRoomIndex === 12) {
                    let groundColor = BABYLON.Color4.FromHexString("#000000FF");
                    let wallColor = BABYLON.Color4.FromHexString("#000000FF");
                    await this.instantiateSimple(groundColor, wallColor, 10);
                }
                else if (this._currentRoomIndex === 13) {
                    /*
                    let groundColor = BABYLON.Color4.FromHexString("#3c5053ff");
                    let wallColor = BABYLON.Color4.FromHexString("#4fb0c4ff");
                    wallColor = BABYLON.Color4.FromHexString("#ffffffff");
                    await this.instantiateSimple(groundColor, wallColor, 5);
                    */
                    //await this.instantiateBBPuzzle("./lib/marble-run-simulator-core/datas/skyboxes/sky-2.jpeg");
                    this.decors.forEach(decor => {
                        decor.dispose();
                    });
                    this.decors = [];

                    this.skybox.isVisible = false;
                    this.wall.isVisible = false;
                    this.ground.isVisible = false;
                    this.frame.isVisible = false;
                    this.ceiling.isVisible = false;
                    this.isBlurred = false;
                }
                if (this.onRoomJustInstantiated) {
                    this.onRoomJustInstantiated();
                }
                await this.animateShow(forceAndskipAnimation ? 0 : 1);
            }
        }

        public contextualRoomIndex(index: number, q: GraphicQuality): number {
            // 1 is the lite version of 0
            if (index === 0 && q === GraphicQuality.VeryLow) {
                return 1;
            }
            if (index === 1 && q > GraphicQuality.VeryLow) {
                return 0;
            }
            // 8 is the lite version of 7
            if (index === 7 && q === GraphicQuality.VeryLow) {
                return 8;
            }
            if (index === 8 && q > GraphicQuality.VeryLow) {
                return 7;
            }
            // 10 is the lite version of 9
            if (index === 9 && q === GraphicQuality.VeryLow) {
                return 10;
            }
            if (index === 10 && q > GraphicQuality.VeryLow) {
                return 9;
            }
            return index;
        }

        public async instantiateSimple(groundColor: BABYLON.Color4, wallColor: BABYLON.Color4, size: number = 10): Promise<void> {
            this.decors.forEach(decor => {
                decor.dispose();
            });
            this.decors = [];

            this.skybox.isVisible = true;
            this.frame.isVisible = false;

            let slice9Ground = Mummu.Create9SliceVertexData({ width: size, height: size, margin: 0.1, color: groundColor, uv1InWorldSpace: true });
            Mummu.RotateAngleAxisVertexDataInPlace(slice9Ground, Math.PI * 0.5, BABYLON.Axis.X);
            slice9Ground.applyToMesh(this.ground);
            this.ground.material = this.game.materials.whiteMaterial;

            let slice9Front = Mummu.Create9SliceVertexData({ width: size, height: 3.2, margin: 0.1, color: wallColor });
            Mummu.TranslateVertexDataInPlace(slice9Front, new BABYLON.Vector3(0, 0, size * 0.5));

            let slice9Right = Mummu.Create9SliceVertexData({ width: size, height: 3.2, margin: 0.1, color: wallColor });
            Mummu.RotateAngleAxisVertexDataInPlace(slice9Right, Math.PI * 0.5, BABYLON.Axis.Y);
            Mummu.TranslateVertexDataInPlace(slice9Right, new BABYLON.Vector3(size * 0.5, 0, 0));

            let slice9Back = Mummu.Create9SliceVertexData({ width: size, height: 3.2, margin: 0.1, color: wallColor });
            Mummu.RotateAngleAxisVertexDataInPlace(slice9Back, Math.PI, BABYLON.Axis.Y);
            Mummu.TranslateVertexDataInPlace(slice9Back, new BABYLON.Vector3(0, 0, - size * 0.5));

            let slice9Left = Mummu.Create9SliceVertexData({ width: size, height: 3.2, margin: 0.1, color: wallColor });
            Mummu.RotateAngleAxisVertexDataInPlace(slice9Left, - Math.PI * 0.5, BABYLON.Axis.Y);
            Mummu.TranslateVertexDataInPlace(slice9Left, new BABYLON.Vector3(- size * 0.5, 0, 0));

            Mummu.MergeVertexDatas(slice9Front, slice9Right, slice9Back, slice9Left).applyToMesh(this.wall);
            this.wall.material = this.game.materials.wallShadow;
            
            let slice9Top = Mummu.Create9SliceVertexData({ width: size, height: size, margin: 0.2, color: wallColor });
            Mummu.RotateAngleAxisVertexDataInPlace(slice9Top, - Math.PI * 0.5, BABYLON.Axis.X);
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
            })
            if (this.machine && this.machine.baseFrame) {
                this.light1.includedOnlyMeshes.push(this.machine.baseFrame);
                this.light2.includedOnlyMeshes.push(this.machine.baseFrame);
            }

            if (this.machine) {
                this.setGroundHeight(this.machine.baseMeshMinY - 0.8);
            }
        }

        public async instantiateMuseum(useDecors?: boolean, skyboxPath?: string): Promise<void> {
            this.decors.forEach(decor => {
                decor.dispose();
            });
            this.decors = [];

            this.skybox.isVisible = true;
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
            Mummu.RotateAngleAxisVertexDataInPlace(slice9Top, - Math.PI * 0.5, BABYLON.Axis.X);
            slice9Top.applyToMesh(this.ceiling);
            this.ceiling.material = this.game.materials.whiteMaterial;

            let paintingNames = ["bilbao_1", "bilbao_2", "bilbao_3", "flower_1", "flower_2", "flower_3", "flower_4", "fort_william_1", "glasgow_1"];
            let n = 0;
            let randomPainting = () => {
                return paintingNames[n++];
            };

            if (useDecors) {
                let paint1 = new Painting(this, randomPainting(), 0.8);
                await paint1.instantiate();
                paint1.position.copyFromFloats(4, 0, 4);
                paint1.rotation.y = -0.75 * Math.PI;
                this.decors.push(paint1);
    
                let paint11 = new Painting(this, randomPainting(), 0.8);
                await paint11.instantiate();
                paint11.position.copyFromFloats(2.8, 0, 4.5);
                paint11.rotation.y = -Math.PI;
                this.decors.push(paint11);
    
                let paint2 = new Painting(this, randomPainting(), 0.8);
                await paint2.instantiate();
                paint2.position.copyFromFloats(4, 0, -4);
                paint2.rotation.y = -0.25 * Math.PI;
                this.decors.push(paint2);
    
                let paint21 = new Painting(this, randomPainting(), 0.8);
                await paint21.instantiate();
                paint21.position.copyFromFloats(2.8, 0, -4.5);
                this.decors.push(paint21);
    
                let paint3 = new Painting(this, randomPainting(), 0.8);
                await paint3.instantiate();
                paint3.position.copyFromFloats(-4, 0, -4);
                paint3.rotation.y = 0.25 * Math.PI;
                this.decors.push(paint3);
    
                let paint31 = new Painting(this, randomPainting(), 0.8);
                await paint31.instantiate();
                paint31.position.copyFromFloats(-4.5, 0, -2.8);
                paint31.rotation.y = 0.5 * Math.PI;
                this.decors.push(paint31);
    
                let paint32 = new Painting(this, randomPainting(), 0.8);
                await paint32.instantiate();
                paint32.position.copyFromFloats(-2.8, 0, -4.5);
                this.decors.push(paint32);
    
                let paint4 = new Painting(this, randomPainting(), 0.8);
                await paint4.instantiate();
                paint4.position.copyFromFloats(-4, 0, 4);
                paint4.rotation.y = 0.75 * Math.PI;
                this.decors.push(paint4);
    
                let paint41 = new Painting(this, randomPainting(), 0.8);
                await paint41.instantiate();
                paint41.position.copyFromFloats(-2.8, 0, 4.5);
                paint41.rotation.y = Math.PI;
                this.decors.push(paint41);
    
                let sculpt1 = new Sculpt(this, this.game.materials.getMaterial(0, this.machine.materialQ));
                await sculpt1.instantiate();
                sculpt1.position.copyFromFloats(4.5, 0, 0);
                sculpt1.rotation.y = -0.5 * Math.PI;
                this.decors.push(sculpt1);
    
                let sculpt2 = new Sculpt(this, this.game.materials.getMaterial(1, this.machine.materialQ));
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
            })
            if (this.machine && this.machine.baseFrame) {
                this.light1.includedOnlyMeshes.push(this.machine.baseFrame);
                this.light2.includedOnlyMeshes.push(this.machine.baseFrame);
            }

            if (this.machine) {
                this.setGroundHeight(this.machine.baseMeshMinY - 0.8);
            }
        }

        public async instantiateOpenRoom(useDecors?: boolean, skyboxPath?: string): Promise<void> {
            this.decors.forEach(decor => {
                decor.dispose();
            });
            this.decors = [];

            this.skybox.isVisible = true;
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
                let art1 = new Art(this, "./lib/marble-run-simulator-core/datas/meshes/arts.babylon", 0);
                await art1.instantiate();
                art1.position.copyFromFloats(3.5, 0, 3.5);
                this.decors.push(art1);
                
                let art2 = new Art(this, "./lib/marble-run-simulator-core/datas/meshes/arts.babylon", 1);
                art2.h = 0.2;
                await art2.instantiate();
                art2.position.copyFromFloats(-4, 0, 3.5);
                this.decors.push(art2);
                
                let art3 = new Art(this, "./lib/marble-run-simulator-core/datas/meshes/arts.babylon", 0);
                art3.h = 0.2;
                await art3.instantiate();
                art3.position.copyFromFloats(-4, 0, -3.5);
                this.decors.push(art3);

                let art4 = new Art(this, "./lib/marble-run-simulator-core/datas/meshes/arts.babylon", 1);
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
            })
            if (this.machine && this.machine.baseFrame) {
                this.light1.includedOnlyMeshes.push(this.machine.baseFrame);
                this.light2.includedOnlyMeshes.push(this.machine.baseFrame);
            }

            if (this.machine) {
                this.setGroundHeight(this.machine.baseMeshMinY - 0.8);
            }
        }

        public async instantiateBBPuzzle(skyboxPath?: string): Promise<void> {
            this.decors.forEach(decor => {
                decor.dispose();
            });
            this.decors = [];

            this.skybox.isVisible = false;
            this.frame.isVisible = true;

            let skyTexture = new BABYLON.Texture(skyboxPath, undefined, undefined, false);
            this.skyboxMaterial.diffuseTexture = skyTexture;
            this.skyboxMaterial.emissiveTexture = skyTexture;

            (new BABYLON.VertexData).applyToMesh(this.ground);
            (new BABYLON.VertexData).applyToMesh(this.wall);
            (new BABYLON.VertexData).applyToMesh(this.frame);
            (new BABYLON.VertexData).applyToMesh(this.ceiling);

            this.isBlurred = false;

            this.light1.intensity = 0.8;
            this.light2.intensity = 0;

            this.light1.includedOnlyMeshes = [this.ground, this.frame, this.ceiling, this.wall, this.skybox];
            this.light2.includedOnlyMeshes = [this.ground, this.frame, this.ceiling, this.wall, this.skybox];
            this.decors.forEach(decor => {
                this.light1.includedOnlyMeshes.push(...decor.getAllMeshes());
                this.light2.includedOnlyMeshes.push(...decor.getAllMeshes());
            })
            if (this.machine && this.machine.baseFrame) {
                this.light1.includedOnlyMeshes.push(this.machine.baseFrame);
                this.light2.includedOnlyMeshes.push(this.machine.baseFrame);
            }

            if (this.machine) {
                this.setGroundHeight(this.machine.baseMeshMinY - 0.8);
            }
        }

        public async animateShow(duration: number = 1): Promise<void> {
            return new Promise<void>((resolve) => {
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
                        
                        this.ground.rotation.y = - 0.5 * Math.PI * (1 - f);
                        this.ground.scaling.copyFromFloats(f, f, f);

                        this.wall.rotation.y = 0.5 * Math.PI * (1 - f);
                        this.wall.scaling.copyFromFloats(4 - 3 * f, f, 4 - 3 * f);
                        
                        this.ceiling.rotation.y = - 0.5 * Math.PI * (1 - f);
                        this.ceiling.scaling.copyFromFloats(f, f, f);

                        requestAnimationFrame(step);
                    }
                }
                step();
            });
        }

        public async animateHide(duration: number = 1): Promise<void> {
            return new Promise<void>((resolve) => {
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
                        
                        this.ground.rotation.y = - 0.5 * Math.PI;
                        this.ground.scaling.copyFromFloats(0, 0, 0);

                        this.wall.rotation.y = 0.5 * Math.PI;
                        this.wall.scaling.copyFromFloats(4, 0, 4);
                        
                        this.ceiling.rotation.y = - 0.5 * Math.PI;
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

                        this.ground.rotation.y = - 0.5 * Math.PI * f;
                        this.ground.scaling.copyFromFloats(1 - f, 1 - f, 1 - f);

                        this.wall.rotation.y = 0.5 * Math.PI * (f - 1);
                        this.wall.scaling.copyFromFloats(1 + f, 1 - f, 1 + f);
                        
                        this.ceiling.rotation.y = - 0.5 * Math.PI * f;
                        this.ceiling.scaling.copyFromFloats(1 - f, 1 - f, 1 - f);

                        requestAnimationFrame(step);
                    }
                }
                step();
            });
        }

        public setGroundHeight(h: number) {
            if (this.ground) {
                this.ground.position.y = h;
                this.wall.position.y = this.ground.position.y + 1.6;
                this.ceiling.position.y = this.ground.position.y + 3.2;
                this.decors.forEach(decor => {
                    decor.position.y = this.ground.position.y + decor.h;
                });
            }
        }

        public dispose(): void {
            this.ground.dispose();
            this.frame.dispose();
            this.wall.dispose();
            this.light1.dispose();
            this.light2.dispose();
        }
    }
}
