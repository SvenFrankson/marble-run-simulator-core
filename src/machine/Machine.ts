/// <reference path="../../../babylon.d.ts"/>
/// <reference path="../../../nabu/nabu.d.ts"/>
/// <reference path="../../../mummu/mummu.d.ts"/>

var THE_ORIGIN_OF_TIME_ms;
var IsTouchScreen: number;

namespace MarbleRunSimulatorCore {

    function NToHex(n: number, l: number = 2): string {
        return n.toString(36).padStart(l, "0").substring(0, l);
    }

    var ballOffset = 23328; // it's 36 * 36 * 36 / 2
    var partOffset = 648; // it's 36 * 36 / 2

    export enum GraphicQuality {
        Proxy,
        VeryLow,
        Low,
        Medium,
        High,
        VeryHigh
    }

    export enum GeometryQuality {
        Proxy,
        Low,
        Medium,
        High
    }

    export enum MaterialQuality {
        Standard,
        PBR
    }

    export interface IGame {
        scene: BABYLON.Scene;
        DEBUG_MODE: boolean;
        vertexDataLoader: Mummu.VertexDataLoader;
        materials: MainMaterials;
        room?: Room;
        spotLight: BABYLON.SpotLight;
        mode: GameMode;
        shadowGenerator: BABYLON.ShadowGenerator;
        gridIMin: number;
        gridIMax: number;
        gridJMin: number;
        gridJMax: number;
        gridKMin: number;
        gridKMax: number;
        currentTimeFactor: number;
        physicDT: number;
        timeFactor: number;
        mainVolume: number;
        averagedFPS: number;
    }

    // Should be removed
    export enum GameMode {
        Home,
        Page,
        Create,
        Challenge,
        Demo,
        GravityControl
    }

    export interface IBallData {
        x: number;
        y: number;
        z?: number;
    }

    export interface IMachinePartData {
        name: string;
        i: number;
        j: number;
        k?: number;
        mirrorX?: boolean;
        mirrorZ?: boolean;
        c?: number | number[];
    }

    export interface IMachineData {
        n?: string; // v2
        name?: string; // v1 - deprecated
        a?: string; // v2
        author?: string; // v1 - deprecated
        v?: number; // v2
        sleepers?: ISleeperMeshProps; // v1 - deprecated
        balls?: IBallData[]; // v1 - deprecated
        parts?: IMachinePartData[]; // v1 - deprecated
        d?: string; // v2
        r?: number; // v6 - RoomIndex
        sp?: ISleeperMeshProps; // v10
    }

    export class Machine {
        public name: string = "Unnamed Machine";
        public author: string = "Unknown Author";
        public isChallengeMachine: boolean = false;

        public root: BABYLON.Mesh;
        public pedestalTop: BABYLON.Mesh;
        public baseFrame: BABYLON.Mesh;
        public baseLogo: BABYLON.Mesh;
        public TEST_USE_BASE_FPS: boolean = false; // only for Poki playtest
        public baseFPS: BABYLON.Mesh;
        public fpsMaterial: BABYLON.StandardMaterial;
        public fpsTexture: BABYLON.DynamicTexture;
        public baseAxis: BABYLON.Mesh;
        public parts: MachinePart[] = [];
        public decors: MachineDecor[] = [];
        public balls: Ball[] = [];
        public debugAxis: BABYLON.LinesMesh;
        public sleepersMeshProp: ISleeperMeshProps;

        public trackFactory: MachinePartFactory;
        public templateManager: TemplateManager;

        public sleeperVertexData: BABYLON.VertexData[];

        public ready: boolean = false;
        public instantiated: boolean = false;
        public hasBeenOpenedInEditor: boolean = false;
        public minimalAutoQualityFailed: number = GraphicQuality.VeryHigh + 1;

        public playing: boolean = false;

        public exitShooter: Shooter;
        public exitTrack: Start;
        public exitHoleIn: BABYLON.Mesh;
        public exitHolePath: BABYLON.Vector3[];
        public exitHoleOut: BABYLON.Mesh;

        public baseColor: string = "#ffffff";

        private _roomIndex: number = 0;
        public get roomIndex(): number {
            return this._roomIndex;
        }
        public setRoomIndex(roomIndex: number): void {
            this._roomIndex = roomIndex;
            this.game.room.setRoomIndex(this.game.room.contextualRoomIndex(this._roomIndex, this.graphicQ));
        }

        public graphicQ: GraphicQuality = GraphicQuality.Medium;
        public get geometryQ(): GeometryQuality {
            let graphicQ = this.graphicQ;
            if (graphicQ === GraphicQuality.Proxy) {
                return GeometryQuality.Proxy;
            }
            else if (graphicQ === GraphicQuality.Low) {
                return GeometryQuality.Medium;
            }
            else if (graphicQ >= GraphicQuality.Medium) {
                return GeometryQuality.High
            }
            return GeometryQuality.Low;
        }
    
        public get materialQ(): MaterialQuality {
            let graphicQ = this.graphicQ;
            if (graphicQ >= GraphicQuality.High) {
                return MaterialQuality.PBR
            }
            return MaterialQuality.Standard;
        }

        constructor(public game: IGame) {
            this.root = new BABYLON.Mesh("machine-root");
            let material = new BABYLON.StandardMaterial("white-material");
            material.diffuseColor.copyFromFloats(1, 1, 1);
            material.specularColor.copyFromFloats(0.2, 0.2, 0.2);
            material.emissiveColor.copyFromFloats(0.1, 0.1, 0.1);
            this.root.material = material;

            this.name = MachineName.GetRandom();
            this.trackFactory = new MachinePartFactory(this);
            this.templateManager = new TemplateManager(this);

            this.sleepersMeshProp = { grndAnchors: true, grndAnchorsMaxY: 0.35 };

            this.exitShooter = new Shooter(this, { i: 0, j: 0, k: 0, h: 3, mirrorX: true, c: [0, 0, 0, 6, 3] });
            this.exitShooter.parent = this.root;
            this.exitShooter.isSelectable = false;
            this.exitShooter.offsetPosition.copyFromFloats(0, 0, 0.02);
            this.exitShooter.sleepersMeshProp = { forceDrawWallAnchors: true, forcedWallAnchorsZ: 0.019 };

            this.exitTrack = new Start(this, { i: 0, j: 0, k: 0, mirrorX: true, c: [0] });
            this.exitTrack.parent = this.root;
            this.exitTrack.isSelectable = false;
            this.exitTrack.offsetPosition.copyFromFloats(0, 0, 0.02);
            this.exitTrack.sleepersMeshProp = { forceDrawWallAnchors: true, forcedWallAnchorsZ: 0.019 };
            
            this.exitHolePath = [new BABYLON.Vector3(0.011, -0.002, 0), new BABYLON.Vector3(0.01835, 0, 0)];

            // Do the drawing before exitHole have been subdivided, spare a few triangles.
            let tmpMesh = BABYLON.MeshBuilder.CreateLathe("exit-hole-in", { shape: [new BABYLON.Vector3(0.011, -0.1, 0), ...this.exitHolePath], tessellation: 32, sideOrientation: BABYLON.Mesh.DOUBLESIDE });
            let data = BABYLON.VertexData.ExtractFromMesh(tmpMesh);
            tmpMesh.dispose();
            
            Mummu.CatmullRomPathInPlace(this.exitHolePath, Tools.V3Dir(0), Tools.V3Dir(90));
            Mummu.CatmullRomPathInPlace(this.exitHolePath, Tools.V3Dir(0), Tools.V3Dir(90));
            Mummu.CatmullRomPathInPlace(this.exitHolePath, Tools.V3Dir(0), Tools.V3Dir(90));
            
            this.exitHolePath = [new BABYLON.Vector3(0.011, -0.1, 0), ...this.exitHolePath];

            let colors = []
            for (let i = 0; i < data.positions.length / 3; i++) {
                if (data.positions[3 * i + 1] < - 0.05) {
                    colors.push(0, 0, 0, 1);
                }
                else {
                    colors.push(1, 1, 1, 1);
                }
            }
            data.colors = colors;
            let bottomData = Mummu.CreateQuadVertexData(
                {
                    p1: new BABYLON.Vector3(-0.02, -0.1, -0.02),
                    p2: new BABYLON.Vector3(-0.02, -0.1, 0.02),
                    p3: new BABYLON.Vector3(0.02, -0.1, 0.02),
                    p4: new BABYLON.Vector3(0.02, -0.1, -0.02),
                    colors: new BABYLON.Color4(0, 0, 0, 1),
                    sideOrientation: 1
                }
            )
            data = Mummu.MergeVertexDatas(data, bottomData);

            this.exitHoleIn = new BABYLON.Mesh("exit-hole-in");
            this.exitHoleIn.parent = this.root;
            this.exitHoleIn.material = this.game.materials.plasticBlack;
            data.applyToMesh(this.exitHoleIn);

            this.exitHoleOut = new BABYLON.Mesh("exit-hole-out");
            this.exitHoleOut.parent = this.root;
            this.exitHoleOut.material = this.game.materials.plasticBlack;
            data.applyToMesh(this.exitHoleOut);
            this.exitHoleOut.rotation.x = - Math.PI * 0.5;

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

        public setAllIsSelectable(isSelectable: boolean): void {
            for (let i = 0; i < this.parts.length; i++) {
                this.parts[i].isSelectable = isSelectable;
            }
        }

        public async instantiate(hotReload?: boolean): Promise<void> {
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

            return new Promise<void>((resolve) => {
                requestAnimationFrame(() => {
                    for (let i = 0; i < this.parts.length; i++) {
                        this.parts[i].recomputeAbsolutePath();
                    }
                    this.exitShooter.recomputeAbsolutePath();
                    this.exitTrack.recomputeAbsolutePath();
                    this.instantiated = true;
                    resolve();
                });
            });
        }

        public reset(): void {
            this.isChallengeMachine = false;
            this.name = MachineName.GetRandom();
            this.author = "";
            this.minimalAutoQualityFailed = GraphicQuality.VeryHigh + 1;
        }
        
        public dispose(): void {
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

        public getBallPos(): any {
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
                }
                datas.balls.push(data);
            }
            let elevators: Elevator[] = this.parts.filter(p => { return p instanceof Elevator }) as Elevator[];
            for (let i = 0; i < elevators.length; i++) {
                datas.elevators.push(elevators[i].x);
            }
            let screws: Screw[] = this.parts.filter(p => { return p instanceof Screw }) as Screw[];
            for (let i = 0; i < screws.length; i++) {
                datas.screws.push(screws[i].a);
            }
            let stairways: Stairway[] = this.parts.filter(p => { return p instanceof Stairway }) as Stairway[];
            for (let i = 0; i < stairways.length; i++) {
                datas.stairways.push(stairways[i].a);
            }
            return datas;
        }

        public applyBallPos(save: any): void {
            for (let i = 0; i < this.balls.length && i < save.balls.length; i++) {
                let ball = this.balls[i];
                ball.position = save.balls[i].p.clone();
                ball.velocity = save.balls[i].v.clone();
            }
            let elevators: Elevator[] = this.parts.filter(p => { return p instanceof Elevator }) as Elevator[];
            for (let i = 0; i < elevators.length && i < save.elevators.length; i++) {
                elevators[i].x = save.elevators[i];
            }
            let screws: Screw[] = this.parts.filter(p => { return p instanceof Screw }) as Screw[];
            for (let i = 0; i < screws.length && i < save.screws.length; i++) {
                screws[i].a = save.elevators[i];
            }
            let stairways: Stairway[] = this.parts.filter(p => { return p instanceof Stairway }) as Stairway[];
            for (let i = 0; i < stairways.length && i < save.stairways.length; i++) {
                stairways[i].a = save.elevators[i];
            }
        }

        public update(): void {
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

        public onPlayCallbacks: Nabu.UniqueList<() => void> = new Nabu.UniqueList<() => void>();
        public play(): void {
            this._paused = false;
            this.playing = true;
            this.decors.forEach(decor => {
                decor.findMachinePart();
            });
            this.onPlayCallbacks.forEach((callback) => {
                callback();
            });
        }

        private _paused: boolean = false;
        public get paused(): boolean {
            return this._paused;
        }
        public pause(): void {
            this._paused = true;
            this.playing = false;
        }

        public onStopCallbacks: Nabu.UniqueList<() => void> = new Nabu.UniqueList<() => void>();
        public get stopped(): boolean {
            return !this.playing && !this.paused;
        }
        public stop(): void {
            for (let i = 0; i < this.balls.length; i++) {
                this.balls[i].reset();
            }
            this.onStopCallbacks.forEach((callback) => {
                callback();
            });
            this._paused = false;
            this.playing = false;
        }

        public margin: number = 0.05;

        public baseMeshMinX: number = -this.margin;
        public baseMeshMaxX: number = this.margin;
        public baseMeshMinY: number = -this.margin;
        public baseMeshMaxY: number = this.margin;
        public baseMeshMinZ: number = -this.margin;
        public baseMeshMaxZ: number = this.margin;

        public tracksMinX: number = 0;
        public tracksMaxX: number = 0;
        public tracksMinY: number = 0;
        public tracksMaxY: number = 0;
        public tracksMinZ: number = 0;
        public tracksMaxZ: number = 0;

        public async generateBaseMesh(): Promise<void> {
            let previousBaseMinY = this.baseMeshMinY;

            this.baseMeshMinX = - tileWidth * 0.5;
            this.baseMeshMaxX = tileWidth * 0.5;
            this.baseMeshMinY = - tileHeight * 0.5;
            this.baseMeshMaxY = tileHeight;
            this.baseMeshMinZ = - tileDepth * 0.5;
            this.baseMeshMaxZ = tileDepth * 0.5;

            this.tracksMinX = Infinity;
            this.tracksMaxX = - Infinity;
            this.tracksMinY = Infinity;
            this.tracksMaxY = - Infinity;
            this.tracksMinZ = Infinity;
            this.tracksMaxZ = - Infinity;
            if (this.parts.length === 0) {
                this.tracksMinX = 0;
                this.tracksMaxX = 0;
                this.tracksMinY = 0;
                this.tracksMaxY = 0;
                this.tracksMinZ = 0;
                this.tracksMaxZ = 0;
            }

            let maxI = 1;
            let minJ = - 1;
            let minK = -1;
            for (let i = 0; i < this.parts.length; i++) {
                let track = this.parts[i];
                this.baseMeshMinX = Math.min(this.baseMeshMinX, track.position.x - tileWidth * 0.5);
                this.baseMeshMaxX = Math.max(this.baseMeshMaxX, track.position.x + tileWidth * (track.w - 0.5));
                //this.baseMeshMinY = Math.min(this.baseMeshMinY, track.position.y - tileHeight * (track.h + 1));
                this.baseMeshMaxY = Math.max(this.baseMeshMaxY, track.position.y);
                this.baseMeshMinZ = Math.min(this.baseMeshMinZ, track.position.z - tileDepth * (track.d - 0.5));
                this.baseMeshMaxZ = Math.max(this.baseMeshMaxZ, track.position.z + tileDepth * 0.5);
                
                this.tracksMinX = Math.min(this.tracksMinX, track.position.x - tileWidth * 0.5);
                this.tracksMaxX = Math.max(this.tracksMaxX, track.position.x + tileWidth * (track.w - 0.5));
                this.tracksMinY = Math.min(this.tracksMinY, track.position.y - tileHeight * (track.h + 1));
                this.tracksMaxY = Math.max(this.tracksMaxY, track.position.y);
                this.tracksMinZ = Math.min(this.tracksMinZ, track.position.z - tileDepth * (track.d - 0.5));
                this.tracksMaxZ = Math.max(this.tracksMaxZ, track.position.z + tileDepth * 0.5);

                maxI = Math.max(maxI, track.i + track.w);
                minJ = Math.min(minJ, track.j);
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
                    } else if (x < 0) {
                        positions[3 * i] -= w * 0.5 - 0.01 + this.margin;
                    }
                    if (y > 0) {
                        positions[3 * i + 1] += h * 0.5 - 0.01 + this.margin;
                    } else if (y < 0) {
                        positions[3 * i + 1] -= h * 0.5 - 0.01 + this.margin;
                    }
                }
                data.positions = positions;
                data.applyToMesh(this.baseFrame);
            } else {
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
                let data = Mummu.CloneVertexData(vertexDatas[0]);
                Mummu.ColorizeVertexDataInPlace(data, BABYLON.Color3.FromHexString(this.baseColor));
                let positions = [...data.positions];
                for (let i = 0; i < positions.length / 3; i++) {
                    let x = positions[3 * i];
                    let z = positions[3 * i + 2];

                    if (x > 0) {
                        positions[3 * i] += w * 0.5 - 0.5 + this.margin;
                    } else if (x < 0) {
                        positions[3 * i] -= w * 0.5 - 0.5 + this.margin;
                    }
                    if (z > 0) {
                        positions[3 * i + 2] += d * 0.5 - 0.5 + this.margin;
                    } else if (z < 0) {
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
                this.pedestalTop.material = this.game.materials.velvetMaterial;

                data = Mummu.CloneVertexData(vertexDatas[1]);
                let uvs = [];
                positions = [...data.positions];
                for (let i = 0; i < positions.length / 3; i++) {
                    let x = positions[3 * i];
                    let z = positions[3 * i + 2];

                    if (x > 0) {
                        positions[3 * i] += w * 0.5 - 0.5 + this.margin;
                    } else if (x < 0) {
                        positions[3 * i] -= w * 0.5 - 0.5 + this.margin;
                    }
                    if (z > 0) {
                        positions[3 * i + 2] += d * 0.5 - 0.5 + this.margin;
                    } else if (z < 0) {
                        positions[3 * i + 2] -= d * 0.5 - 0.5 + this.margin;
                    }
                    uvs.push(positions[3 * i] * 2);
                    uvs.push(positions[3 * i + 2] * 2);
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
                console.log("minK = " + minK);
                this.exitShooter.setI(maxI - 2, true);
                this.exitShooter.setJ(minJ - 5, true);
                this.exitShooter.setK(minK - 1, true);
                this.exitShooter.recomputeAbsolutePath();
                this.exitShooter.refreshEncloseMeshAndAABB();
                console.log(this.exitShooter.i + " " + this.exitShooter.j + " " + this.exitShooter.k);
            }
            if (this.exitTrack) {
                this.exitTrack.setI(maxI + 1, true);
                this.exitTrack.setJ(minJ - 5, true);
                this.exitTrack.setK(minK - 2, true);
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
        }

        public regenerateBaseAxis(): void {
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

        public setBaseIsVisible(v: boolean) {
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

        public getBankAt(pos: BABYLON.Vector3, exclude: MachinePart): { isEnd: boolean; bank: number; part: MachinePart; pipeTrack: boolean } {
            for (let i = 0; i < this.parts.length; i++) {
                let part = this.parts[i];
                if (part != exclude) {
                    for (let j = 0; j < part.tracks.length; j++) {
                        let track = part.tracks[j];
                        if (BABYLON.Vector3.DistanceSquared(track.startWorldPosition, pos) < 0.000001) {
                            return { isEnd: false, bank: track.preferedStartBank, part: part, pipeTrack: track instanceof PipeTrack || track instanceof WoodTrack };
                        }
                        if (BABYLON.Vector3.DistanceSquared(track.endWorldPosition, pos) < 0.000001) {
                            return { isEnd: true, bank: track.preferedEndBank, part: part, pipeTrack: track instanceof PipeTrack || track instanceof WoodTrack };
                        }
                    }
                }
            }
        }

        public static MachineDataCompare(d1: IMachineData, d2: IMachineData): boolean {
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

        public serialize(): IMachineData {
            return this.serializeV11();
        }

        public serializeV1(): IMachineData {
            let data: IMachineData = {
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

        public serializeV2(): IMachineData {
            let data: IMachineData = {
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
                let index = TrackNames.findIndex((name) => {
                    return name.startsWith(baseName);
                });
                if (index === - 1) {
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

        public serializeV3456(version: number): IMachineData {
            let data: IMachineData = {
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
                if (version === 4 || version >= 6) {
                    dataString += NToHex(ball.materialIndex, 2);
                }
            }

            // Add parts count
            dataString += NToHex(this.parts.length, 2);
            for (let i = 0; i < this.parts.length; i++) {
                let partDataString = "";
                let part = this.parts[i];
                let baseName = part.partName.split("-")[0];
                let index = TrackNames.findIndex((name) => {
                    return name.startsWith(baseName);
                });
                console.log(part.partName + " " + baseName + " " + index);
                if (index === - 1) {
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

        public serializeV8(): IMachineData {
            let data: IMachineData = {
                n: this.name,
                a: this.author,
                v: 8
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
                dataString += NToHex(ball.materialIndex, 2);
            }

            // Add parts count
            dataString += NToHex(this.parts.length, 2);
            for (let i = 0; i < this.parts.length; i++) {
                let partDataString = "";
                let part = this.parts[i];
                let baseName = part.partName.split("-")[0];
                let index = TrackNames.findIndex((name) => {
                    return name.startsWith(baseName);
                });
                if (index === - 1) {
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

            dataString += NToHex(this.decors.length, 2);
            for (let i = 0; i < this.decors.length; i++) {
                let decor = this.decors[i];
                let x = Math.round(decor.position.x * 1000) + ballOffset;
                let y = Math.round(decor.position.y * 1000) + ballOffset;
                let z = Math.round(decor.position.z * 1000) + ballOffset;
                dataString += NToHex(x, 3);
                dataString += NToHex(y, 3);
                dataString += NToHex(z, 3);
                dataString += NToHex(decor.n, 2);
                dataString += NToHex(decor.flip ? 1 : 0, 1);
            }

            data.d = dataString;

            return data;
        }

        public serializeV910(version: number): IMachineData {
            let data: IMachineData = {
                n: this.name,
                a: this.author,
                v: version,
                r: this.roomIndex
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
                dataString += NToHex(ball.materialIndex, 2);
            }

            // Add parts count
            dataString += NToHex(this.parts.length, 2);
            for (let i = 0; i < this.parts.length; i++) {
                let partDataString = "";
                let part = this.parts[i];
                let baseName = part.partName.split("-")[0];
                let index = TrackNames.findIndex((name) => {
                    return name.startsWith(baseName);
                });
                if (index === - 1) {
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
                partDataString += NToHex(part.s, 1);
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

            dataString += NToHex(this.decors.length, 2);
            for (let i = 0; i < this.decors.length; i++) {
                let decor = this.decors[i];
                let x = Math.round(decor.position.x * 1000) + ballOffset;
                let y = Math.round(decor.position.y * 1000) + ballOffset;
                let z = Math.round(decor.position.z * 1000) + ballOffset;
                dataString += NToHex(x, 3);
                dataString += NToHex(y, 3);
                dataString += NToHex(z, 3);
                dataString += NToHex(decor.n, 2);
                dataString += NToHex(decor.flip ? 1 : 0, 1);
            }

            data.d = dataString;

            if (version === 10) {
                data.sp = this.sleepersMeshProp;
            }

            return data;
        }

        public serializeV11(): IMachineData {
            let data: IMachineData = {
                n: this.name,
                a: this.author,
                v: 11,
                r: this.roomIndex
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
                dataString += NToHex(ball.materialIndex, 2);
            }

            // Add parts count
            dataString += NToHex(this.parts.length, 2);
            for (let i = 0; i < this.parts.length; i++) {
                let partDataString = "";
                let part = this.parts[i];
                let baseName = part.partName.split("-")[0];
                let index = TrackNames.findIndex((name) => {
                    return name.startsWith(baseName);
                });
                if (index === - 1) {
                    console.error("Error, can't find part index.");
                    debugger;
                }
                partDataString += NToHex(index, 2);
                
                let pI = part.i + partOffset;
                let pJ = part.j + partOffset;
                let pK = part.k + partOffset;
                let pR = part.r;
                partDataString += NToHex(pI, 2);
                partDataString += NToHex(pJ, 2);
                partDataString += NToHex(pK, 2);
                partDataString += NToHex(pR, 1);

                partDataString += NToHex(part.w, 1);
                partDataString += NToHex(part.h, 1);
                partDataString += NToHex(part.d, 1);
                partDataString += NToHex(part.n, 1);
                partDataString += NToHex(part.s, 1);
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

            dataString += NToHex(this.decors.length, 2);
            for (let i = 0; i < this.decors.length; i++) {
                let decor = this.decors[i];
                let x = Math.round(decor.position.x * 1000) + ballOffset;
                let y = Math.round(decor.position.y * 1000) + ballOffset;
                let z = Math.round(decor.position.z * 1000) + ballOffset;
                dataString += NToHex(x, 3);
                dataString += NToHex(y, 3);
                dataString += NToHex(z, 3);
                dataString += NToHex(decor.n, 2);
                dataString += NToHex(decor.flip ? 1 : 0, 1);
            }

            data.d = dataString;

            data.sp = this.sleepersMeshProp;

            return data;
        }

        public lastDeserializedData: IMachineData;
        public deserialize(data: IMachineData): void {
            this.lastDeserializedData = data;
            this.minimalAutoQualityFailed = GraphicQuality.VeryHigh + 1;
            this.isChallengeMachine = false;
            if (data) {
                let version: number;
                if (isFinite(data.v)) {
                    version = data.v;
                }
                console.log("deserialize version " + version);

                if (!isFinite(version) || version === 1) {
                    return this.deserializeV1(data);
                }
                else if (version === 2) {
                    return this.deserializeV2(data);
                }
                else if (version === 3 || version === 4 || version === 5 || version === 6) {
                    return this.deserializeV3456(data);
                }
                else if (version === 7 || version === 8) {
                    return this.deserializeV78(data);
                }
                else if (version === 9 || version === 10) {
                    return this.deserializeV910(data);
                }
                else if (version === 11) {
                    return this.deserializeV11(data);
                }
            }
        }

        public deserializeV1(data: IMachineData): void {
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
                let ball = new Ball(new BABYLON.Vector3(ballData.x, ballData.y, isFinite(ballData.z) ? ballData.z : 0), this);
                this.balls.push(ball);
            }

            for (let i = 0; i < data.parts.length; i++) {
                let part = data.parts[i];
                let prop: IMachinePartProp = {
                    i: part.i * 2,
                    j: part.j,
                    k: part.k,
                    mirrorX: part.mirrorX,
                    mirrorZ: part.mirrorZ,
                };
                if (typeof part.c === "number") {
                    prop.c = [part.c];
                } else if (part.c) {
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

        public deserializeV2(data: IMachineData): void {
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
                    x = x / 0.075 * tileWidth;
                    let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    y = y / 0.03 * tileHeight;
                    let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    z = z / 0.06 * tileDepth;

                    let ball = new Ball(new BABYLON.Vector3(x, y, z), this);
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
                    let baseName = TrackNames[index].split("-")[0];
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
                    let colors: number[] = [];
                    for (let ii = 0; ii < colorCount; ii++) {
                        colors[ii] = parseInt(dataString.substring(pt, pt += 1), 36);
                    }

                    let prop: IMachinePartProp = {
                        i: pI * 3,
                        j: pJ,
                        k: pK * 3,
                        w: w,
                        h: h,
                        d: d,
                        n: n,
                        mirrorX: (mirror % 2) === 1,
                        mirrorZ: mirror >= 2,
                        c: colors
                    }
                    let track = this.trackFactory.createTrackBaseName(baseName, prop);
                    if (track) {
                        this.parts.push(track);
                    }
                }
            }
        }

        public deserializeV3456(data: IMachineData): void {
            let dataString = data.d;
            if (dataString) {
                if (data.n) {
                    this.name = data.n;
                }
                if (data.a) {
                    this.author = data.a;
                }
                if (data.r) {
                    this._roomIndex = data.r;
                }
                else {
                    this._roomIndex = 0;
                }
            
                this.balls = [];
                this.parts = [];

                let pt = 0;
                let ballCount = parseInt(dataString.substring(pt, pt += 2), 36);

                for (let i = 0; i < ballCount; i++) {
                    let x = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    x = x / 0.075 * tileWidth;
                    let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    y = y / 0.03 * tileHeight;
                    let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    z = z / 0.06 * tileDepth;

                    let ball = new Ball(new BABYLON.Vector3(x, y, z), this);
                    this.balls.push(ball);

                    if (data.v === 4 || data.v >= 6) {
                        let materialIndex = parseInt(dataString.substring(pt, pt += 2), 36);
                        ball.materialIndex = materialIndex;
                    }
                }
                
                let partCount = parseInt(dataString.substring(pt, pt += 2), 36);

                for (let i = 0; i < partCount; i++) {
                    let index = parseInt(dataString.substring(pt, pt += 2), 36);
                    let baseName = TrackNames[index].split("-")[0];

                    let pI = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                    let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                    let pK = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;

                    let correctedPI = pI * 3;
                    let correctedPJ = - pK * 3;
                    let correctedPK = -pJ;

                    console.log(correctedPI + " " + correctedPJ + " " + correctedPK);

                    let w = parseInt(dataString.substring(pt, pt += 1), 36);
                    let h = parseInt(dataString.substring(pt, pt += 1), 36);
                    let d = parseInt(dataString.substring(pt, pt += 1), 36);
                    let n = parseInt(dataString.substring(pt, pt += 1), 36);
                    let mirror = parseInt(dataString.substring(pt, pt += 1), 36);

                    let colorCount = parseInt(dataString.substring(pt, pt += 1), 36);
                    let colors: number[] = [];
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

                    let prop: IMachinePartProp = {
                        i: correctedPI,
                        j: correctedPJ,
                        k: correctedPK,
                        w: w,
                        h: h,
                        d: d,
                        n: n,
                        mirrorX: (mirror % 2) === 1,
                        mirrorZ: mirror >= 2,
                        c: colors
                    }
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

                let minK = 0;
                for (let i = 0; i < this.parts.length; i++) {
                    let part = this.parts[i];
                    minK = Math.min(minK, part.k - part.h);
                }

                if (minK < 0) {
                    for (let i = 0; i < this.parts.length; i++) {
                        let part = this.parts[i];
                        part.setK(part.k - minK);
                    }
                    for (let i = 0; i < this.balls.length; i++) {
                        let ball = this.balls[i];
                        ball.setPositionZero(ball.positionZero.add(new BABYLON.Vector3(0, - minK * tileHeight, 0)));
                    }
                }
            }
        }

        public deserializeV78(data: IMachineData): void {
            let dataString = data.d;
            if (dataString) {
                if (data.n) {
                    this.name = data.n;
                }
                if (data.a) {
                    this.author = data.a;
                }
                if (data.r) {
                    this._roomIndex = data.r;
                }
                else {
                    this._roomIndex = 0;
                }
            
                this.balls = [];
                this.parts = [];

                let pt = 0;
                let ballCount = parseInt(dataString.substring(pt, pt += 2), 36);
                //console.log("ballCount = " + ballCount);

                for (let i = 0; i < ballCount; i++) {
                    let x = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    x = x / 0.075 * tileWidth;
                    let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    y = y / 0.03 * tileHeight;
                    let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    z = z / 0.06 * tileDepth;

                    let ball = new Ball(new BABYLON.Vector3(x, y, z), this);
                    this.balls.push(ball);

                    let materialIndex = parseInt(dataString.substring(pt, pt += 2), 36);
                    ball.materialIndex = materialIndex;
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
                    let baseName = TrackNames[index].split("-")[0];

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
                    let colors: number[] = [];
                    for (let ii = 0; ii < colorCount; ii++) {
                        colors[ii] = parseInt(dataString.substring(pt, pt += 1), 36);
                    }

                    let prop: IMachinePartProp = {
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
                    }
                    
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

                let decorCount = parseInt(dataString.substring(pt, pt += 2), 36);
                for (let i = 0; i < decorCount; i++) {
                    let x = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;

                    //console.log("ball xyz " + x + " " + y + " " + z);
                    let decor = new Xylophone(this);
                    decor.setPosition(new BABYLON.Vector3(x, y, z));
                    this.decors.push(decor);

                    let n = parseInt(dataString.substring(pt, pt += 2), 36);
                    decor.setN(n);

                    if (data.v === 8) {
                        let f = parseInt(dataString.substring(pt, pt += 1), 36) === 1 ? true : false;
                        decor.setFlip(f);
                    }
                }
            }
        }

        public deserializeV910(data: IMachineData): void {
            let dataString = data.d;
            if (dataString) {
                if (data.n) {
                    this.name = data.n;
                }
                if (data.a) {
                    this.author = data.a;
                }
                if (data.v === 10) {
                    if (data.sp) {
                        this.sleepersMeshProp = data.sp;
                    }
                }
            
                this.balls = [];
                this.parts = [];

                let pt = 0;
                let ballCount = parseInt(dataString.substring(pt, pt += 2), 36);
                //console.log("ballCount = " + ballCount);

                for (let i = 0; i < ballCount; i++) {
                    let x = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    x = x / 0.075 * tileWidth;
                    let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    y = y / 0.03 * tileHeight;
                    let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    z = z / 0.06 * tileDepth;

                    let ball = new Ball(new BABYLON.Vector3(x, y, z), this);
                    this.balls.push(ball);

                    let materialIndex = parseInt(dataString.substring(pt, pt += 2), 36);
                    ball.materialIndex = materialIndex;
                }
                
                let partCount = parseInt(dataString.substring(pt, pt += 2), 36);
                //console.log("partCount = " + partCount);

                for (let i = 0; i < partCount; i++) {
                    let index = parseInt(dataString.substring(pt, pt += 2), 36);
                    if (index >= 0 && index < TrackNames.length) {
                        let baseName = TrackNames[index].split("-")[0];

                        let pI = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                        let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                        let pK = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;

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
                        let colors: number[] = [];
                        for (let ii = 0; ii < colorCount; ii++) {
                            colors[ii] = parseInt(dataString.substring(pt, pt += 1), 36);
                        }

                        if (baseName === "spiralUTurn") {
                            if ((mirror % 2) === 1) {
                                if (d >= 3) {
                                    pI--;
                                }
                            }
                        }
                        let prop: IMachinePartProp = {
                            i: pI * 3,
                            j: pJ,
                            k: pK * 3,
                            w: w,
                            h: h,
                            d: d,
                            n: n,
                            s: s,
                            mirrorX: (mirror % 2) === 1,
                            mirrorZ: mirror >= 2,
                            c: colors
                        }
                        
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

                let decorCount = parseInt(dataString.substring(pt, pt += 2), 36);
                for (let i = 0; i < decorCount; i++) {
                    let x = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;

                    //console.log("ball xyz " + x + " " + y + " " + z);
                    let decor = new Xylophone(this);
                    decor.setPosition(new BABYLON.Vector3(x, y, z));
                    this.decors.push(decor);

                    let n = parseInt(dataString.substring(pt, pt += 2), 36);
                    decor.setN(n);

                    if (data.v === 8) {
                        let f = parseInt(dataString.substring(pt, pt += 1), 36) === 1 ? true : false;
                        decor.setFlip(f);
                    }
                }

                if (data.r) {
                    this._roomIndex = data.r;
                }
                else {
                    if (partCount % 2 === 0) {
                        this._roomIndex = 0;
                    }
                    else if(partCount % 2 === 1) {
                        this._roomIndex = 9;
                    }
                    else {
                        this._roomIndex = 0;
                    }
                }
            }
        }

        public deserializeV11(data: IMachineData): void {
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

                    let ball = new Ball(new BABYLON.Vector3(x, y, z), this);
                    this.balls.push(ball);

                    let materialIndex = parseInt(dataString.substring(pt, pt += 2), 36);
                    ball.materialIndex = materialIndex;
                }
                
                let partCount = parseInt(dataString.substring(pt, pt += 2), 36);
                //console.log("partCount = " + partCount);

                for (let i = 0; i < partCount; i++) {
                    let index = parseInt(dataString.substring(pt, pt += 2), 36);
                    if (index >= 0 && index < TrackNames.length) {
                        let baseName = TrackNames[index].split("-")[0];

                        let pI = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                        let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                        let pK = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                        let pR = parseInt(dataString.substring(pt, pt += 1), 36);

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
                        let colors: number[] = [];
                        for (let ii = 0; ii < colorCount; ii++) {
                            colors[ii] = parseInt(dataString.substring(pt, pt += 1), 36);
                        }

                        let prop: IMachinePartProp = {
                            i: pI,
                            j: pJ,
                            k: pK,
                            r: pR,
                            w: w,
                            h: h,
                            d: d,
                            n: n,
                            s: s,
                            mirrorX: (mirror % 2) === 1,
                            mirrorZ: mirror >= 2,
                            c: colors
                        }
                        
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

                let decorCount = parseInt(dataString.substring(pt, pt += 2), 36);
                for (let i = 0; i < decorCount; i++) {
                    let x = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;

                    //console.log("ball xyz " + x + " " + y + " " + z);
                    let decor = new Xylophone(this);
                    decor.setPosition(new BABYLON.Vector3(x, y, z));
                    this.decors.push(decor);

                    let n = parseInt(dataString.substring(pt, pt += 2), 36);
                    decor.setN(n);

                    if (data.v === 8) {
                        let f = parseInt(dataString.substring(pt, pt += 1), 36) === 1 ? true : false;
                        decor.setFlip(f);
                    }
                }

                if (data.r) {
                    this._roomIndex = data.r;
                }
                else {
                    if (partCount % 2 === 0) {
                        this._roomIndex = 0;
                    }
                    else if(partCount % 2 === 1) {
                        this._roomIndex = 9;
                    }
                    else {
                        this._roomIndex = 0;
                    }
                }
            }
        }

        public getEncloseStart(): BABYLON.Vector3 {
            let encloseStart: BABYLON.Vector3 = new BABYLON.Vector3(Infinity, -Infinity, -Infinity);
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

        public getEncloseEnd(): BABYLON.Vector3 {
            let encloseEnd: BABYLON.Vector3 = new BABYLON.Vector3(-Infinity, Infinity, Infinity);
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

        public requestUpdateShadow: boolean = false;
        public updateShadow(): void {
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
}