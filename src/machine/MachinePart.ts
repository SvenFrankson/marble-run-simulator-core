namespace MarbleRunSimulatorCore {
    export var baseRadius = 0.075;
    export var tileWidth = 0.075;
    export var tileHeight = 0.03;
    export var tileDepth = 0.06;
    export var colorSlotsCount = 6;

    export enum PartVisibilityMode {
        Default,
        Selected,
        Ghost,
    }

    export interface ITrackPointData {
        position: { x: number; y: number; z: number };
        normal?: { x: number; y: number; z: number };
        dir?: { x: number; y: number; z: number };
        tangentIn?: number;
        tangentOut?: number;
    }

    export interface ITrackData {
        points: ITrackPointData[];
    }

    var selectorHullShapeDisplayTip: BABYLON.Vector3[] = [];
    for (let i = 0; i < 10; i++) {
        let a = (i / 10) * 2 * Math.PI;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        selectorHullShapeDisplayTip[i] = new BABYLON.Vector3(cosa * 0.01, sina * 0.01, 0);
    }

    var selectorHullPipeShapeDisplayTip: BABYLON.Vector3[] = [];
    for (let i = 0; i < 10; i++) {
        let a = (i / 10) * 2 * Math.PI;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        selectorHullPipeShapeDisplayTip[i] = new BABYLON.Vector3(cosa * 0.014, sina * 0.014, 0);
    }

    var selectorHullShapeDisplay: BABYLON.Vector3[] = [];
    for (let i = 0; i < 10; i++) {
        let a = (i / 10) * 2 * Math.PI;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        selectorHullShapeDisplay[i] = new BABYLON.Vector3(cosa * 0.009, sina * 0.009, 0);
    }

    var selectorHullPipeShapeDisplay: BABYLON.Vector3[] = [];
    for (let i = 0; i < 10; i++) {
        let a = (i / 10) * 2 * Math.PI;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        selectorHullPipeShapeDisplay[i] = new BABYLON.Vector3(cosa * 0.012, sina * 0.012, 0);
    }
    
    export class MachinePartSelectorMesh extends BABYLON.Mesh {
        constructor(public part: MachinePart) {
            super("machine-part-selector");
        }
    }

    export enum EndpointEditionMode {
        None,
        OriginDestination,
        AxisX,
        AxisY,
        AxisZ
    }

    export class EndpointSelectorMesh extends BABYLON.Mesh {

        constructor(public endpoint: MachinePartEndpoint) {
            super("endpoint-selector");
        }
    }

    export class MachinePartEndpoint {

        public connectedEndPoint: MachinePartEndpoint;
        public i: number = 0;
        public j: number = 0;
        public k: number = 0;
        public index: number = - 1;

        public selectorMeshDisplay: BABYLON.Mesh;

        public helperMesh: BABYLON.Mesh;

        public mode: EndpointEditionMode = EndpointEditionMode.None;

        constructor(
            public localPosition: BABYLON.Vector3,
            public machinePart: MachinePart
        ) {
            this.i = Math.round((localPosition.x + tileWidth * 0.5) / tileWidth);
            this.j = - Math.round((localPosition.y) / tileHeight);
            this.k = - Math.round((localPosition.z) / tileDepth);
        }

        public get leftSide(): boolean {
            return this.localPosition.x < 0;
        }

        public get upperSide(): boolean {
            return this.localPosition.y > this.machinePart.encloseMid.y;
        }

        public get farSide(): boolean {
            return this.localPosition.z > this.machinePart.encloseMid.z;
        }

        public isIJK(worldIJK: Nabu.IJK): boolean {
            return (this.i + this.machinePart.i) === worldIJK.i && (this.j + this.machinePart.j) === worldIJK.j && (this.k + this.machinePart.k) === worldIJK.k;
        }

        private _absolutePosition: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public get absolutePosition(): BABYLON.Vector3 {
            this._absolutePosition.copyFrom(this.localPosition);
            this._absolutePosition.addInPlace(this.machinePart.position);
            return this._absolutePosition;
        }

        public connectTo(endPoint: MachinePartEndpoint) {
            this.connectedEndPoint = endPoint;
            endPoint.connectedEndPoint = this;
        }

        public disconnect(): void {
            if (this.connectedEndPoint) {
                this.connectedEndPoint.connectedEndPoint = undefined;
            }
            this.connectedEndPoint = undefined;
        }

        private _hovered: boolean = false;
        public hover(): void {
            this._hovered = true;
            this.updateSelectorMeshVisibility();
        }

        public anhover(): void {
            this._hovered = false;
            this.updateSelectorMeshVisibility();
        }

        public updateSelectorMeshVisibility(): void {
            let selectorMesh = this.machinePart.selectorEndpointsDisplay[this.index];
            if (selectorMesh) {
                if (this._hovered) {
                    selectorMesh.visibility = 0.2;
                }
                else {
                    selectorMesh.visibility = 0;
                }
            }
        }

        public showHelperMesh(): void {
            if (!this.helperMesh) {
                let data = BABYLON.CreateCylinderVertexData({ height: 0.01, tessellation: 10, diameter: 0.02 });
                Mummu.RotateAngleAxisVertexDataInPlace(data, Math.PI * 0.5, BABYLON.Axis.Z);
                Mummu.TranslateVertexDataInPlace(data, new BABYLON.Vector3(this.leftSide ? 0.02 : - 0.02, 0, 0));
                Mummu.ColorizeVertexDataInPlace(data, BABYLON.Color3.FromHexString("#80FFFF"));
                this.helperMesh = new BABYLON.Mesh("helper-mesh");
                this.helperMesh.material = this.machinePart.game.materials.whiteFullLitMaterial;
                this.helperMesh.alphaIndex = 1;
                data.applyToMesh(this.helperMesh);
            }
        }

        public hideHelperMesh(): void {
            if (this.helperMesh) {
                this.helperMesh.dispose();
                this.helperMesh = undefined;
            }
        }

        public updateHelperMesh(mode: number, timer: number): void {
            if (this.helperMesh) {
                if (mode === 0) {
                    let sign = this.leftSide ? 1 : - 1;
                    this.helperMesh.position.copyFrom(this.absolutePosition);
                    this.helperMesh.position.x -= sign * 0.5 * 0.015;
        
                    this.helperMesh.visibility = Math.sin(timer * Math.PI) * 0.5;
                }
                else if (mode === 1) {
                    let sign = this.leftSide ? 1 : - 1;
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

    export class MachinePart extends BABYLON.Mesh {
        public fullPartName: string = "";

        public get partName(): string {
            return this.template ? this.template.partName : "machine-part-no-template";
        }

        public get game(): IGame {
            return this.machine.game;
        }

        public tracks: Track[] = [];
        public wires: Wire[] = [];
        public allWires: Wire[] = [];

        public wireSize: number = 0.0015;
        public wireGauge: number = 0.014;

        public colors: number[] = [0];
        public getColor(index: number): number {
            index = Nabu.MinMax(index, 0, this.colors.length - 1);
            return this.colors[index];
        }
        public sleepersMeshes: Map<number, BABYLON.Mesh> = new Map<number, BABYLON.Mesh>();
        public selectorBodyDisplay: BABYLON.Mesh;
        public selectorBodyLogic: MachinePartSelectorMesh;
        public selectorEndpointsDisplay: BABYLON.Mesh[] = [];
        public selectorEndpointsLogic: EndpointSelectorMesh[] = [];
        public encloseMesh: BABYLON.Mesh;
        public isSelectable: boolean = true;
        public onBeforeDelete: () => void;

        public summedLength: number[] = [0];
        public totalLength: number = 0;
        public globalSlope: number = 0;
        public AABBMin: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public AABBMax: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public encloseStart: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public enclose13: BABYLON.Vector3 = BABYLON.Vector3.One().scaleInPlace(1 / 3);
        public encloseMid: BABYLON.Vector3 = BABYLON.Vector3.One().scaleInPlace(0.5);
        public enclose23: BABYLON.Vector3 = BABYLON.Vector3.One().scaleInPlace(2 / 3);
        public encloseEnd: BABYLON.Vector3 = BABYLON.Vector3.One();
        public localCenter: BABYLON.Vector3 = BABYLON.Vector3.Zero();

        public endPoints: MachinePartEndpoint[] = [];
        public findEndPoint(localPosition: BABYLON.Vector3): MachinePartEndpoint {
            return this.endPoints.find(endpoint => { return BABYLON.Vector3.Distance(endpoint.localPosition, localPosition) < 0.001});
        }
        public neighbours: Nabu.UniqueList<MachinePart> = new Nabu.UniqueList<MachinePart>();
        public addNeighbour(other: MachinePart): void {
            for (let i = 0; i < this.endPoints.length; i++) {
                let thisEndpoint = this.endPoints[i];
                for (let j = 0; j < other.endPoints.length; j++) {
                    let otherEndpoint = other.endPoints[j];
                    if (thisEndpoint.leftSide != otherEndpoint.leftSide) {
                        if (BABYLON.Vector3.Distance(thisEndpoint.absolutePosition, otherEndpoint.absolutePosition) < 0.001) {
                            thisEndpoint.disconnect();
                            thisEndpoint.connectTo(otherEndpoint);
                        }
                    }
                }
            }
            this.neighbours.push(other);
            other.neighbours.push(this);
        }
        public removeNeighbour(other: MachinePart): void {
            for (let i = 0; i < this.endPoints.length; i++) {
                let thisEndpoint = this.endPoints[i];
                if (thisEndpoint.connectedEndPoint && thisEndpoint.connectedEndPoint.machinePart === other) {
                    thisEndpoint.disconnect();
                }
            }
            this.neighbours.remove(other);
            other.neighbours.remove(this);
        }
        public removeAllNeighbours(): void {
            while (this.neighbours.length > 0) {
                this.removeNeighbour(this.neighbours.get(0));
            }
        }

        public get isRightConnected(): boolean {
            for (let i = 0; i < this.endPoints.length; i++) {
                let endpoint = this.endPoints[i];
                if (!endpoint.leftSide && endpoint.connectedEndPoint) {
                    return true;
                }
            }
            return false;
        }

        public get isUpConnected(): boolean {
            for (let i = 0; i < this.endPoints.length; i++) {
                let endpoint = this.endPoints[i];
                if (endpoint.upperSide && endpoint.connectedEndPoint) {
                    return true;
                }
            }
            return false;
        }

        public get isDownConnected(): boolean {
            for (let i = 0; i < this.endPoints.length; i++) {
                let endpoint = this.endPoints[i];
                if (!endpoint.upperSide && endpoint.connectedEndPoint) {
                    return true;
                }
            }
            return false;
        }

        public get isBackConnected(): boolean {
            for (let i = 0; i < this.endPoints.length; i++) {
                let endpoint = this.endPoints[i];
                if (!endpoint.farSide && endpoint.connectedEndPoint) {
                    return true;
                }
            }
            return false;
        }

        public decors: MachineDecor[] = [];
        public attachDecor(decor: MachineDecor): void {
            if (this.decors.indexOf(decor) === - 1) {
                this.decors.push(decor);
                decor.detachMachinePart();
                decor.machinePart = this;
            }
        }
        public detachDecor(decor: MachineDecor): void {
            let index = this.decors.indexOf(decor);
            if (index > -1) {
                let decor = this.decors.splice(index, 1)[0];
                decor.machinePart = undefined;
            }
        }

        public get w(): number {
            return this.template.w;
        }
        public get h(): number {
            return this.template.h;
        }
        public get d(): number {
            return this.template.d;
        }
        public get n(): number {
            return this.template.n;
        }
        public get s(): number {
            return this.template.s;
        }
        public get mirrorX(): boolean {
            return this.template.mirrorX;
        }
        public get mirrorZ(): boolean {
            return this.template.mirrorZ;
        }

        public get xExtendable(): boolean {
            return this.template.xExtendable;
        }
        public get yExtendable(): boolean {
            return this.template.yExtendable;
        }
        public get zExtendable(): boolean {
            return this.template.zExtendable;
        }
        public get nExtendable(): boolean {
            return this.template.nExtendable;
        }
        public get sExtendable(): boolean {
            return this.template.sExtendable;
        }
        public get minW(): number {
            return this.template.minW;
        }
        public get maxW(): number {
            return this.template.maxW;
        }
        public get minH(): number {
            return this.template.minH;
        }
        public get maxH(): number {
            return this.template.maxH;
        }
        public get minD(): number {
            return this.template.minD;
        }
        public get maxD(): number {
            return this.template.maxD;
        }
        public get minN(): number {
            return this.template.minN;
        }
        public get maxN(): number {
            return this.template.maxN;
        }
        public get minS(): number {
            return this.template.minS;
        }
        public get maxS(): number {
            return this.template.maxS;
        }
        public get xMirrorable(): boolean {
            return this.template.xMirrorable;
        }
        public get zMirrorable(): boolean {
            return this.template.zMirrorable;
        }
        public get hasOriginDestinationHandles(): boolean {
            return this.template.hasOriginDestinationHandles;
        }
        public getIsNaNOrValidWHD(w?: number, h?: number, d?: number): boolean {
            if (isNaN(w) || w >= this.minW && w <= this.maxW) {
                if (isNaN(h) || h >= this.minH && h <= this.maxH) {
                    if (isNaN(d) || d >= this.minD && d <= this.maxD) {
                        return true;
                    }
                }
            }
            return false;
        }

        private _template: MachinePartTemplate;
        public get template(): MachinePartTemplate {
            return this._template;
        }
        public setTemplate(template: MachinePartTemplate) {
            this._template = template;
            this.endPoints = [];
            for (let i = 0; i < this._template.endPoints.length; i++) {
                this.endPoints[i] = new MachinePartEndpoint(this._template.endPoints[i], this);
                this.endPoints[i].index = i;
            }
        }

        public sleepersMeshProp: ISleeperMeshProps;

        constructor(public machine: Machine, prop: IMachinePartProp, public isPlaced: boolean = true) {
            super("track", machine.game.scene);

            if (prop.fullPartName) {
                this.fullPartName = prop.fullPartName;
            }

            this._i = prop.i;
            this._j = prop.j;
            this._k = prop.k;
            if (typeof prop.c === "number") {
                this.colors = [prop.c];
            } else if (prop.c instanceof Array) {
                this.colors = [...prop.c];
            }

            this.position.x = this._i * tileWidth;
            this.position.y = -this._j * tileHeight;
            this.position.z = -this._k * tileDepth;

            this.sleepersMeshProp = this.machine.sleepersMeshProp;

            this.parent = this.machine.root;
            this.tracks = [];
        }

        public offsetPosition: BABYLON.Vector3 = BABYLON.Vector3.Zero();

        private _i: number = 0;
        public get i(): number {
            return this._i;
        }
        public setI(v: number, doNotCheckGridLimits?: boolean) {
            if (this._i != v) {
                this._i = v;
                if (!doNotCheckGridLimits && this.game.mode === GameMode.Challenge) {
                    let i = this._i = Nabu.MinMax(this._i, this.game.gridIMin, this.game.gridIMax - (this.w - 1));
                    if (isFinite(i)) {
                        this._i = i;
                    }
                }
                this.position.x = this._i * tileWidth + this.offsetPosition.x;
                this.freezeWorldMatrix();
                this.getChildMeshes().forEach((m) => {
                    m.freezeWorldMatrix();
                });
                this.update(0);
                this.machine.requestUpdateShadow = true;
            }
        }

        private _j: number = 0;
        public get j(): number {
            return this._j;
        }
        public setJ(v: number, doNotCheckGridLimits?: boolean) {
            if (this._j != v) {
                this._j = v;
                if (!doNotCheckGridLimits && this.game.mode === GameMode.Challenge) {
                    let j = this._j = Nabu.MinMax(this._j, this.game.gridJMin, this.game.gridJMax - this.h);
                    if (isFinite(j)) {
                        this._j = j;
                    }
                }
                this.position.y = -this._j * tileHeight + this.offsetPosition.y;
                this.freezeWorldMatrix();
                this.getChildMeshes().forEach((m) => {
                    m.freezeWorldMatrix();
                });
                this.update(0);
                this.machine.requestUpdateShadow = true;
            }
        }

        private _k: number = 0;
        public get k(): number {
            return this._k;
        }
        public setK(v: number, doNotCheckGridLimits?: boolean) {
            if (this._k != v) {
                this._k = v;
                if (!doNotCheckGridLimits && this.game.mode === GameMode.Challenge) {
                    let k = Nabu.MinMax(this._k, this.game.gridKMin, this.game.gridKMax - (this.d - 1));
                    if (isFinite(k)) {
                        this._k = k;
                    }
                }
                this.position.z = -this._k * tileDepth + this.offsetPosition.z;
                this.freezeWorldMatrix();
                this.getChildMeshes().forEach((m) => {
                    m.freezeWorldMatrix();
                });
                this.update(0);
                this.machine.requestUpdateShadow = true;
            }
        }

        public setIsVisible(isVisible: boolean): void {
            this.isVisible = isVisible;
            this.getChildren(undefined, false).forEach((m) => {
                if (m instanceof BABYLON.Mesh && m.name != "machine-part-selector" && m.name != "enclose-mesh" && !m.name.startsWith("collider-")) {
                    m.isVisible = isVisible;
                }
            });
        }

        private _partVisibilityMode: PartVisibilityMode = PartVisibilityMode.Default;
        public get partVisilibityMode(): PartVisibilityMode {
            return this._partVisibilityMode;
        }
        public set partVisibilityMode(v: PartVisibilityMode) {
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

        private _selected: boolean = false;
        public select(): void {
            this._selected = true;
            this.updateSelectorMeshVisibility();
        }

        public unselect(): void {
            this._selected = false;
            this.updateSelectorMeshVisibility();
        }

        private _hovered: boolean = false;
        public hover(): void {
            this._hovered = true;
            this.updateSelectorMeshVisibility();
        }

        public anhover(): void {
            this._hovered = false;
            this.updateSelectorMeshVisibility();
        }

        public updateSelectorMeshVisibility(): void {
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
        }

        public getDirAndUpAtWorldPos(worldPosition: BABYLON.Vector3): { dir: BABYLON.Vector3, up: BABYLON.Vector3 } {
            let dir = BABYLON.Vector3.Right();
            let up = BABYLON.Vector3.Up();



            return { dir: dir, up: up };
        }
        public getProjection(worldPosition: BABYLON.Vector3, outProj: BABYLON.Vector3, outDir: BABYLON.Vector3, outUp: BABYLON.Vector3): void {
            let localPosition = worldPosition.subtract(this.position);
            let bestSqrDist = Infinity;
            let bestTrack: Track;
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
                let dir: BABYLON.Vector3;
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
                    outProj.copyFrom(point).addInPlace(this.position);
                    outUp.copyFrom(normal);
                    outDir.copyFrom(dir);
                }
            }
        }
        public getSlopeAt(index: number, trackIndex: number = 0): number {
            if (this.tracks[trackIndex]) {
                return this.tracks[trackIndex].getSlopeAt(index);
            }
            return 0;
        }

        public getBankAt(index: number, trackIndex: number = 0): number {
            if (this.tracks[trackIndex]) {
                return this.tracks[trackIndex].getBankAt(index);
            }
            return 0;
        }

        public getBarycenter(): BABYLON.Vector3 {
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

        public recomputeAbsolutePath(): void {
            this.computeWorldMatrix(true);
            this.tracks.forEach((track) => {
                track.recomputeAbsolutePath();
            });
            this.wires.forEach((wire) => {
                wire.recomputeAbsolutePath();
            });
        }

        public instantiated = false;
        public async instantiate(rebuildNeighboursWireMeshes?: boolean): Promise<void> {
            this.instantiated = false;

            let selectorHullShapeLogic: BABYLON.Vector3[] = [];
            for (let i = 0; i < 6; i++) {
                let a = (i / 6) * 2 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                selectorHullShapeLogic[i] = (new BABYLON.Vector3(cosa * 0.009, sina * 0.009, 0)).scaleInPlace((IsTouchScreen === 1 ? 2 : 1));
            }

            let DEBUG_logicColliderVisibility: number = 0;
            let selectorMeshDisplayVertexDatas: BABYLON.VertexData[] = [];
            let selectorMeshLogicVertexDatas: BABYLON.VertexData[] = [];

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
                if (this.tracks[n].template.isPipe) {
                    let normals = this.tracks[n].trackInterpolatedNormals;
                    points = points.map((pt, i) => {
                        return pt.add(normals[i].scale(0.008));
                    });
                }
                Mummu.DecimatePathInPlace(points, (4 / 180) * Math.PI);

                if (Tools.IsWorldPosAConnexion(this.tracks[n].templateInterpolatedPoints[0])) {
                    let endPoint = this.findEndPoint(this.tracks[n].templateInterpolatedPoints[0]);
                    if (endPoint) {
                        let originTip: BABYLON.Vector3[] = [];
                        Mummu.RemoveFromStartForDistanceInPlace(points, 0.017, originTip);
                        Mummu.RemoveFromEndForDistanceInPlace(originTip, 0.002);
                        
                        let shapeTip = this.tracks[n].template.isPipe ? selectorHullPipeShapeDisplayTip : selectorHullShapeDisplayTip;

                        let dataOriginTip = Mummu.CreateExtrudeShapeVertexData({ shape: shapeTip, path: originTip, closeShape: true, cap: BABYLON.Mesh.CAP_ALL });
                        Mummu.ColorizeVertexDataInPlace(dataOriginTip, BABYLON.Color3.FromHexString("#80FFFF"));
                        selectorMeshDisplayVertexDatas.push(dataOriginTip);

                        let selectorEndpoint = new BABYLON.Mesh("selector-endpoint-start");
                        selectorEndpoint.material = this.game.materials.whiteFullLitMaterial;
                        selectorEndpoint.parent = this;
                        dataOriginTip.applyToMesh(selectorEndpoint);
                        selectorEndpoint.visibility = 0;
                        this.selectorEndpointsDisplay.push(selectorEndpoint);
                        
                        let selectorOriginMeshLogic = new EndpointSelectorMesh(endPoint);
                        selectorOriginMeshLogic.material = this.game.materials.whiteFullLitMaterial;
                        selectorOriginMeshLogic.parent = this;
                        selectorOriginMeshLogic.visibility = DEBUG_logicColliderVisibility;
                        let selectorOriginVertexDataLogic = Mummu.CreateExtrudeShapeVertexData({ shape: selectorHullShapeLogic, path: originTip, closeShape: true, cap: BABYLON.Mesh.CAP_ALL });
                        Mummu.ColorizeVertexDataInPlace(selectorOriginVertexDataLogic, BABYLON.Color3.Magenta());
                        selectorOriginVertexDataLogic.applyToMesh(selectorOriginMeshLogic);
                        this.selectorEndpointsLogic.push(selectorOriginMeshLogic);
                    }
                }

                if (Tools.IsWorldPosAConnexion(this.tracks[n].templateInterpolatedPoints[this.tracks[n].templateInterpolatedPoints.length - 1])) {
                    let endPoint = this.findEndPoint(this.tracks[n].templateInterpolatedPoints[this.tracks[n].templateInterpolatedPoints.length - 1]);
                    if (endPoint) {
                        let destinationTip: BABYLON.Vector3[] = [];
                        Mummu.RemoveFromEndForDistanceInPlace(points, 0.017, destinationTip);
                        Mummu.RemoveFromStartForDistanceInPlace(destinationTip, 0.002);
                        
                        let shapeTip = this.tracks[n].template.isPipe ? selectorHullPipeShapeDisplayTip : selectorHullShapeDisplayTip;

                        let dataDestinationTip = Mummu.CreateExtrudeShapeVertexData({ shape: shapeTip, path: destinationTip, closeShape: true, cap: BABYLON.Mesh.CAP_ALL });
                        Mummu.ColorizeVertexDataInPlace(dataDestinationTip, BABYLON.Color3.FromHexString("#80FFFF"));
                        selectorMeshDisplayVertexDatas.push(dataDestinationTip);

                        let selectorEndpoint = new BABYLON.Mesh("selector-endpoint-end");
                        selectorEndpoint.material = this.game.materials.whiteFullLitMaterial;
                        selectorEndpoint.parent = this;
                        dataDestinationTip.applyToMesh(selectorEndpoint);
                        selectorEndpoint.visibility = 0;
                        this.selectorEndpointsDisplay.push(selectorEndpoint);
                        
                        let selectorDestinationMeshLogic = new EndpointSelectorMesh(endPoint);
                        selectorDestinationMeshLogic.material = this.game.materials.whiteFullLitMaterial;
                        selectorDestinationMeshLogic.parent = this;
                        selectorDestinationMeshLogic.visibility = DEBUG_logicColliderVisibility;
                        let selectorDestinationVertexDataLogic = Mummu.CreateExtrudeShapeVertexData({ shape: selectorHullShapeLogic, path: destinationTip, closeShape: true, cap: BABYLON.Mesh.CAP_ALL });
                        Mummu.ColorizeVertexDataInPlace(selectorDestinationVertexDataLogic, BABYLON.Color3.Magenta());
                        selectorDestinationVertexDataLogic.applyToMesh(selectorDestinationMeshLogic);
                        this.selectorEndpointsLogic.push(selectorDestinationMeshLogic);
                    }
                }

                if (points.length >= 2) {
                    let shape = this.tracks[n].template.isPipe ? selectorHullPipeShapeDisplay : selectorHullShapeDisplay;

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

            // Assign EndpointManipulators logic
            if (this instanceof MachinePartWithOriginDestination) {
                this.selectorEndpointsLogic.forEach(selectorEndpoint => {
                    selectorEndpoint.endpoint.mode = EndpointEditionMode.OriginDestination;
                })
            }
            else if (this.xExtendable && !this.yExtendable && !this.zExtendable) {
                this.selectorEndpointsLogic.forEach(selectorEndpoint => {
                    selectorEndpoint.endpoint.mode = EndpointEditionMode.AxisX;
                })
            }
            else if (!this.xExtendable && this.yExtendable && !this.zExtendable) {
                this.selectorEndpointsLogic.forEach(selectorEndpoint => {
                    selectorEndpoint.endpoint.mode = EndpointEditionMode.AxisY;
                })
            }
            else if (this instanceof Wall || !this.xExtendable && !this.yExtendable && this.zExtendable) {
                this.selectorEndpointsLogic.forEach(selectorEndpoint => {
                    selectorEndpoint.endpoint.mode = EndpointEditionMode.AxisZ;
                })
            }

            this.refreshEncloseMeshAndAABB();

            await this.instantiateMachineSpecific();

            this.rebuildWireMeshes(rebuildNeighboursWireMeshes);

            this.freezeWorldMatrix();
            this.getChildMeshes().forEach((m) => {
                m.freezeWorldMatrix();
            });
            this.machine.requestUpdateShadow = true;
            this.instantiated = true;
        }

        protected async instantiateMachineSpecific(): Promise<void> {}

        public refreshEncloseMeshAndAABB(): void {
            if (this.encloseMesh) {
                this.encloseMesh.dispose();
            }
            let w = this.w * tileWidth;
            let h = (this.h + 1) * tileHeight;
            let d = this.d * tileDepth;
            let x0 = -tileWidth * 0.5;
            let y0 = tileHeight * 0.5;
            let z0 = tileDepth * 0.5;
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
            let color = new BABYLON.Color4(1, 1, 1, 0.2);
            this.encloseMesh = BABYLON.MeshBuilder.CreateLineSystem(
                "enclose-mesh",
                {
                    lines: [
                        [new BABYLON.Vector3(x0, y0, z0), new BABYLON.Vector3(x1, y0, z0), new BABYLON.Vector3(x1, y1, z0), new BABYLON.Vector3(x0, y1, z0), new BABYLON.Vector3(x0, y0, z0)],
                        [new BABYLON.Vector3(x0, y0, z0), new BABYLON.Vector3(x0, y0, z1)],
                        [new BABYLON.Vector3(x1, y0, z0), new BABYLON.Vector3(x1, y0, z1)],
                        [new BABYLON.Vector3(x1, y1, z0), new BABYLON.Vector3(x1, y1, z1)],
                        [new BABYLON.Vector3(x0, y1, z0), new BABYLON.Vector3(x0, y1, z1)],
                        [new BABYLON.Vector3(x0, y0, z1), new BABYLON.Vector3(x1, y0, z1), new BABYLON.Vector3(x1, y1, z1), new BABYLON.Vector3(x0, y1, z1), new BABYLON.Vector3(x0, y0, z1)],
                    ],
                    colors: [
                        [color, color, color, color, color],
                        [color, color],
                        [color, color],
                        [color, color],
                        [color, color],
                        [color, color, color, color, color],
                    ]
                },
                this.getScene()
            );
            this.encloseMesh.parent = this;
            this.encloseMesh.visibility = 0;

            this.AABBMin.copyFromFloats(this.encloseStart.x, this.encloseEnd.y, this.encloseEnd.z);
            this.AABBMax.copyFromFloats(this.encloseEnd.x, this.encloseStart.y, this.encloseStart.z);
            this.AABBMin.addInPlace(this.absolutePosition);
            this.AABBMax.addInPlace(this.absolutePosition);
        }

        public dispose(): void {
            this.endPoints.forEach(endpoint => {
                endpoint.hideHelperMesh();
            })
            super.dispose();
            this.removeAllNeighbours();
            let index = this.machine.parts.indexOf(this);
            if (index > -1) {
                this.machine.parts.splice(index, 1);
            }
        }

        public generateWires(): void {
            this.allWires = [...this.wires];
            if (this.template) {
                for (let i = 0; i < this.template.trackTemplates.length; i++) {
                    let track = this.tracks[i];
                    if (!track) {
                        if (this.template.trackTemplates[i].isPipe) {
                            track = new PipeTrack(this);
                        }
                        else {
                            track = new Track(this);
                        }
                        this.tracks[i] = track;
                    }
                    track.initialize(this.template.trackTemplates[i]);
                    this.allWires.push(track.wires[0], track.wires[1]);
                }
            } else {
                console.error("Can't generate wires, no template provided for " + this.partName);
                console.log(this);
            }
        }

        public update(dt: number): void {}

        public rebuildWireMeshes(rebuildNeighboursWireMeshes?: boolean): void {
            let neighboursToUpdate: MachinePart[];
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
                if (track instanceof PipeTrack) {
                    PipeTrackMeshBuilder.BuildPipeTrackMesh(track, {});
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

        public doSleepersMeshUpdate(): void {
            if (!this.instantiated || this.isDisposed()) {
                return;
            }
            let datas = SleeperMeshBuilder.GenerateSleepersVertexData(this, this.sleepersMeshProp);
            datas.forEach((vData, colorIndex) => {
                if (!this.sleepersMeshes.get(colorIndex)) {
                    let sleeperMesh = new BABYLON.Mesh("sleeper-mesh-" + colorIndex);
                    sleeperMesh.parent = this;
                    this.sleepersMeshes.set(colorIndex, sleeperMesh);
                }
                let sleeperMesh = this.sleepersMeshes.get(colorIndex);
                sleeperMesh.material = this.game.materials.getMaterial(colorIndex);
                vData.applyToMesh(sleeperMesh);
                sleeperMesh.freezeWorldMatrix();
            });
            this.machine.requestUpdateShadow = true;
            if (this.game.DEBUG_MODE) {

            }
        }

        public getTriCount(): number {
            let triCount = this.getIndices().length / 3;
            let children = this.getChildMeshes();
            children.forEach((child) => {
                triCount += child.getIndices().length / 3;
            });
            return triCount;
        }
    }
}
