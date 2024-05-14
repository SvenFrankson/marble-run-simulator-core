/// <reference path="../../../babylon.d.ts"/>
/// <reference path="../../../nabu/nabu.d.ts"/>
/// <reference path="../../../mummu/mummu.d.ts"/>

namespace MarbleRunSimulatorCore {

    function NToHex(n: number, l: number = 2): string {
        return n.toString(36).padStart(l, "0").substring(0, l);
    }

    var ballOffset = 23328; // it's 36 * 36 * 36 / 2
    var partOffset = 648; // it's 36 * 36 / 2

    export interface IGame {
        scene: BABYLON.Scene;
        DEBUG_MODE: boolean;
        vertexDataLoader: Mummu.VertexDataLoader;
        materials: MainMaterials;
        room: Room;
        spotLight: BABYLON.SpotLight;
        machine: Machine;
        mode: GameMode;
        shadowGenerator: BABYLON.ShadowGenerator;
        getGraphicQ: () => number;
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
    }

    export enum GameMode {
        Home,
        Page,
        Create,
        Challenge,
        Demo
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
    }

    export class Machine {
        public name: string = "Unnamed Machine";
        public author: string = "Unknown Author";

        public baseWall: BABYLON.Mesh;
        public baseFrame: BABYLON.Mesh;
        public baseLogo: BABYLON.Mesh;
        public baseAxis: BABYLON.Mesh;
        public parts: MachinePart[] = [];
        public balls: Ball[] = [];
        public debugAxis: BABYLON.LinesMesh;

        public trackFactory: MachinePartFactory;
        public templateManager: TemplateManager;

        public instantiated: boolean = false;

        public playing: boolean = false;

        constructor(public game: IGame) {
            this.name = MachineName.GetRandom();
            this.trackFactory = new MachinePartFactory(this);
            this.templateManager = new TemplateManager(this);
        }

        public setAllIsSelectable(isSelectable: boolean): void {
            for (let i = 0; i < this.parts.length; i++) {
                this.parts[i].isSelectable = isSelectable;
            }
        }

        public async instantiate(): Promise<void> {
            console.log("instantiate machine");
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

            return new Promise<void>((resolve) => {
                requestAnimationFrame(() => {
                    for (let i = 0; i < this.parts.length; i++) {
                        this.parts[i].recomputeAbsolutePath();
                    }
                    this.instantiated = true;
                    resolve();
                });
            });
        }

        public dispose(): void {
            while (this.balls.length > 0) {
                this.balls[0].dispose();
            }
            while (this.parts.length > 0) {
                this.parts[0].dispose();
            }
            this.instantiated = false;
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
                    p: ball.position,
                    v: ball.velocity
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
                ball.position = save.balls[i].p;
                ball.velocity = save.balls[i].v;
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
                        this.balls[i].update(dt);
                    }
                    for (let i = 0; i < this.parts.length; i++) {
                        this.parts[i].update(dt);
                    }
                }
            } else {
                for (let i = 0; i < this.balls.length; i++) {
                    this.balls[i].marbleLoopSound.setVolume(0, 0.1);
                    this.balls[i].marbleBowlLoopSound.setVolume(0, 0.1);
                }
            }
        }

        public play(): void {
            this.playing = true;
        }

        public onStopCallbacks: Nabu.UniqueList<() => void> = new Nabu.UniqueList<() => void>();
        public stop(): void {
            for (let i = 0; i < this.balls.length; i++) {
                this.balls[i].reset();
            }
            this.onStopCallbacks.forEach((callback) => {
                callback();
            });
            this.playing = false;
        }

        public margin: number = 0.05;
        public baseMeshMinX: number = -this.margin;
        public baseMeshMaxX: number = this.margin;
        public baseMeshMinY: number = -this.margin;
        public baseMeshMaxY: number = this.margin;
        public baseMeshMinZ: number = -this.margin;
        public baseMeshMaxZ: number = this.margin;
        public async generateBaseMesh(): Promise<void> {
            let previousBaseMinY = this.baseMeshMinY;

            this.baseMeshMinX = -this.margin;
            this.baseMeshMaxX = this.margin;
            this.baseMeshMinY = -this.margin;
            this.baseMeshMaxY = this.margin;
            this.baseMeshMinZ = -this.margin;
            this.baseMeshMaxZ = this.margin;
            for (let i = 0; i < this.parts.length; i++) {
                let track = this.parts[i];
                this.baseMeshMinX = Math.min(this.baseMeshMinX, track.position.x - tileWidth * 0.5);
                this.baseMeshMaxX = Math.max(this.baseMeshMaxX, track.position.x + tileWidth * (track.w - 0.5));
                this.baseMeshMinY = Math.min(this.baseMeshMinY, track.position.y - tileHeight * (track.h + 1));
                this.baseMeshMaxY = Math.max(this.baseMeshMaxY, track.position.y);
                this.baseMeshMinZ = Math.min(this.baseMeshMinZ, track.position.z - tileDepth * (track.d - 0.5));
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

        public getBankAt(pos: BABYLON.Vector3, exclude: MachinePart): { isEnd: boolean; bank: number; part: MachinePart } {
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

        public serialize(): IMachineData {
            return this.serializeV3();
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

        public serializeV3(): IMachineData {
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

        public deserialize(data: IMachineData): void {
            if (data) {
                let version: number;
                if (isFinite(data.v)) {
                    version = data.v;
                }

                if (!isFinite(version) || version === 1) {
                    return this.deserializeV1(data);
                }
                else if (version === 2) {
                    return this.deserializeV2(data);
                }
                else if (version === 3) {
                    return this.deserializeV3(data);
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
                    let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                    let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;

                    //console.log("ball xyz " + x + " " + y + " " + z);
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
                }
            }
        }

        public deserializeV3(data: IMachineData): void {
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
            return encloseStart;
        }

        public getEncloseEnd(): BABYLON.Vector3 {
            let encloseEnd: BABYLON.Vector3 = new BABYLON.Vector3(-Infinity, Infinity, Infinity);
            this.parts.forEach((part) => {
                encloseEnd.x = Math.max(encloseEnd.x, part.position.x + part.encloseEnd.x);
                encloseEnd.y = Math.min(encloseEnd.y, part.position.y + part.encloseEnd.y);
                encloseEnd.z = Math.min(encloseEnd.z, part.position.z + part.encloseEnd.z);
            });
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
            }
        }
    }
}
