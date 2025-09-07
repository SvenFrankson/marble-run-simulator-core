namespace MarbleRunSimulatorCore {
    
    export var tileSize = 0.025;
    export var tileWidth = 0.075;
    export var legacyTileHeight = 0.03;
    export var tileHeight = 0.025;
    export var legacyTileDepth = 0.06;
    export var tileDepth = 0.075;
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
    for (let i = 0; i < 6; i++) {
        let a = (i / 6) * 2 * Math.PI;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        selectorHullShapeDisplayTip[i] = new BABYLON.Vector3(cosa * 0.01, sina * 0.01, 0);
    }

    var selectorHullPipeShapeDisplayTip: BABYLON.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
        let a = (i / 6) * 2 * Math.PI;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        selectorHullPipeShapeDisplayTip[i] = new BABYLON.Vector3(cosa * 0.014, sina * 0.014, 0);
    }

    var selectorHullShapeDisplay: BABYLON.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
        let a = (i / 6) * 2 * Math.PI;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        selectorHullShapeDisplay[i] = new BABYLON.Vector3(cosa * 0.009, sina * 0.009, 0);
    }

    var selectorHullPipeShapeDisplay: BABYLON.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
        let a = (i / 6) * 2 * Math.PI;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        selectorHullPipeShapeDisplay[i] = new BABYLON.Vector3(cosa * 0.012, sina * 0.012, 0);
    }
    
    export class MachinePartSelectorMesh extends BABYLON.Mesh {
        constructor(public part: MachinePart) {
            super("machine-part-selector");
        }
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

        constructor(
            public localPosition: BABYLON.Vector3,
            public localR: number,
            public machinePart: MachinePart
        ) {
            let dir = Mummu.Rotate(BABYLON.Axis.X, BABYLON.Axis.Y, - localR * Math.PI * 0.5);
            this.i = Math.round((localPosition.x + dir.x * tileSize * 0.5) / tileSize);
            this.j = Math.round((localPosition.z + dir.z * tileSize * 0.5) / tileSize);
            this.k = Math.round((localPosition.y) / tileHeight);
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

        public get isOrigin(): boolean {
            return this.index === 0;
        }

        public isIJK(worldIJK: Nabu.IJK): boolean {
            return (this.i + this.machinePart.i) === worldIJK.i && (this.j + this.machinePart.j) === worldIJK.j && (this.k + this.machinePart.k) === worldIJK.k;
        }

        private _absolutePosition: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public get absolutePosition(): BABYLON.Vector3 {
            BABYLON.Vector3.TransformCoordinatesToRef(this.localPosition, this.machinePart.getWorldMatrix(), this._absolutePosition);
            return this._absolutePosition;
        }

        public getRotatedI(r: number): number {
            if (r === 0) {
                return this.i;
            }
            if (r === 1) {
                return - this.j;
            }
            if (r === 2) {
                return - this.i;
            }
            if (r === 3) {
                return this.j;
            }
        }

        public getRotatedJ(r: number): number {
            if (r === 0) {
                return this.j;
            }
            if (r === 1) {
                return this.i;
            }
            if (r === 2) {
                return - this.j;
            }
            if (r === 3) {
                return - this.i;
            }
        }

        public get absoluteR(): number {
            return (this.machinePart.r + this.localR) % 4;
        }

        public get absoluteRAfterUpdate(): number {
            return (this.machinePart.rAfterUpdate + this.localR) % 4;
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

        public showHelperMesh(): void {
            if (!this.helperMesh) {
                let data = BABYLON.CreateSphereVertexData({ segments: 12, diameter: 0.018 });
                Mummu.RotateAngleAxisVertexDataInPlace(data, Math.PI * 0.5, BABYLON.Axis.Z);
                this.helperMesh = new BABYLON.Mesh("helper-mesh");
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

        public updateHelperMesh(mode: number, color: number, timer: number): void {
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
                    let sign = this.leftSide ? 1 : - 1;
                    this.helperMesh.position.copyFrom(this.absolutePosition);
                    //this.helperMesh.position.x -= sign * 0.5 * 0.015;
        
                    this.helperMesh.visibility = Math.sin(timer * Math.PI) * 1;
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
        public colliders: MachineCollider[] = [];
        public outlinableMeshes: BABYLON.Mesh[] = [];

        public wireSize: number = 0.0015;
        public wireGauge: number = 0.014;

        public colors: number[] = [0];
        public getColor(index: number): number {
            index = Nabu.MinMax(index, 0, this.colors.length - 1);
            return this.colors[index];
        }
        public setColorCount(c: number, defaultValue: number = 0): void {
            if (this.colors.length > c) {
                this.colors = this.colors.slice(0, c);
            }
            else {
                while (this.colors.length < c) {
                    this.colors.push(defaultValue);
                }
            }
        }
        public sleepersMeshes: Map<number, BABYLON.Mesh> = new Map<number, BABYLON.Mesh>();
        public selectorBodyDisplay: BABYLON.Mesh;
        public selectorBodyLogic: MachinePartSelectorMesh;
        public selectorEndpointsDisplay: BABYLON.Mesh[] = [];
        public selectorEndpointsLogic: EndpointSelectorMesh[] = [];
        public encloseMesh: BABYLON.Mesh;
        public gridRectMesh: BABYLON.Mesh;
        public gridHeightMesh: BABYLON.LinesMesh;
        public isSelectable: boolean = true;
        public onBeforeDelete: () => void;

        public summedLength: number[] = [0];
        public totalLength: number = 0;
        public globalSlope: number = 0;
        public localBarycenter: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public localBarycenterIJK: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public localAABBMin: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public localAABBMax: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public localRotatedAABBMin: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public localRotatedAABBMax: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public worldAABBMin: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public worldAABBMax: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public visibleWidth: number = 1;
        public visibleHeight: number = 1;
        public visibleDepth: number = 1;
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
        public findEndPointByWorldPos(worldPosition: BABYLON.Vector3): MachinePartEndpoint {
            let invMatrix = this.getWorldMatrix().clone().invert();
            let localPosition = BABYLON.Vector3.TransformCoordinates(worldPosition, invMatrix);
            return this.findEndPoint(localPosition);
        }
        public findEndPointIndexByWorldPos(worldPosition: BABYLON.Vector3): number {
            return this.endPoints.indexOf(this.findEndPointByWorldPos(worldPosition));
        }
        public neighbours: Nabu.UniqueList<MachinePart> = new Nabu.UniqueList<MachinePart>();
        public addNeighbour(other: MachinePart): void {
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

        public get l(): number {
            return this.template.l;
        }
        public get w(): number {
            return this.template.l;
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
        public magnetic: boolean = false;
        public get mirrorX(): boolean {
            return this.template.mirrorX;
        }
        public get mirrorZ(): boolean {
            return this.template.mirrorZ;
        }

        public get lExtendableOnX(): boolean {
            return this.template.lExtendableOnX;
        }
        public get lExtendableOnXZ(): boolean {
            return this.template.lExtendableOnXZ;
        }
        public get lExtendableOnZ(): boolean {
            return this.template.lExtendableOnZ;
        }
        public get hExtendableOnY(): boolean {
            return this.template.hExtendableOnY;
        }
        public get dExtendableOnZ(): boolean {
            return this.template.dExtendableOnZ;
        }
        public get extendable(): boolean {
            return this.lExtendableOnX || this.lExtendableOnXZ || this.lExtendableOnZ || this.hExtendableOnY || this.dExtendableOnZ;
        }

        public get xExtendable(): boolean {
            return this.template.xExtendable;
        }
        public get yExtendable(): boolean {
            return this.template.yExtendable;
        }
        public get downwardYExtendable(): boolean {
            return this.template.downwardYExtendable;
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
        public get minL(): number {
            return this.template.minL;
        }
        public get maxL(): number {
            return this.template.maxL;
        }
        public get minLAbsolute(): number {
            return this.template.minLAbsolute;
        }
        public get minW(): number {
            return this.template.minL;
        }
        public get maxW(): number {
            return this.template.maxL;
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
        public get minDAbsolute(): number {
            return this.template.minDAbsolute;
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
                this.endPoints[i] = new MachinePartEndpoint(this._template.endPoints[i], MachinePart.DirectionToRValue(this._template.endPointDirections[i]), this);
                this.endPoints[i].index = i;
            }
        }

        public sleepersMeshProp: ISleeperMeshProps;

        constructor(public machine: Machine, prop: IMachinePartProp, public isPlaced: boolean = true) {
            super("track", machine.game.scene);

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
            } else if (prop.c instanceof Array) {
                this.colors = [...prop.c];
            }

            this.position.x = this._i * tileSize;
            this.position.y = this._k * tileHeight;
            this.position.z = this._j * tileSize;
            this.rotation.y = - this._r * Math.PI * 0.5;

            this.sleepersMeshProp = this.machine.sleepersMeshProp;

            this.parent = this.machine.root;
            this.tracks = [];

            this.refreshEncloseMeshAndLocalAABB();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "PropToPartName_NotImplemented";
        }

        public offsetPosition: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public targetUpdatePivot: BABYLON.Vector3;

        private _i: number = 0;
        private _targetI: number;
        public get i(): number {
            return this._i;
        }
        public get iAfterUpdate(): number {
            if (isFinite(this._targetI)) {
                return this._targetI;
            }
            return this._i;
        }
        public setI(v: number, doNotCheckGridLimits?: boolean) {
            if (this._i != v) {
                this._i = v;
                if (!doNotCheckGridLimits && this.game.mode === GameMode.Challenge) {
                    let i = Nabu.MinMax(this._i, this.game.gridIMin - Nabu.RoundTowardZero(this.localRotatedAABBMin.x / tileSize), this.game.gridIMax - Nabu.RoundTowardZero(this.localRotatedAABBMax.x / tileSize));
                    if (isFinite(i)) {
                        this._i = i;
                    }
                }
                this.position.x = this._i * tileSize + this.offsetPosition.x;
                this.refreshWorldMatrix();
                this.update(0);
                this.refreshWorldAABB();
                this.machine.requestUpdateShadow = true;
            }
        }
        public setTargetI(v: number, doNotCheckGridLimits?: boolean): void {
            this._targetI = v;
            if (!doNotCheckGridLimits && this.game.mode === GameMode.Challenge) {
                let i = Nabu.MinMax(this._targetI, this.game.gridIMin - Nabu.RoundTowardZero(this.localRotatedAABBMin.x / tileSize), this.game.gridIMax - Nabu.RoundTowardZero(this.localRotatedAABBMax.x / tileSize));
                if (isFinite(i)) {
                    this._targetI = i;
                }
            }
        }

        private _j: number = 0;
        private _targetJ: number;
        public get j(): number {
            return this._j;
        }
        public get jAfterUpdate(): number {
            if (isFinite(this._targetJ)) {
                return this._targetJ;
            }
            return this._j;
        }
        public setJ(v: number, doNotCheckGridLimits?: boolean) {
            if (this._j != v) {
                this._j = v;
                if (!doNotCheckGridLimits && this.game.mode === GameMode.Challenge) {
                    let j = Nabu.MinMax(this._j, this.game.gridJMin - Nabu.RoundTowardZero(this.localRotatedAABBMin.z / tileSize), this.game.gridJMax - Nabu.RoundTowardZero(this.localRotatedAABBMax.z / tileSize));
                    if (isFinite(j)) {
                        this._j = j;
                    }
                }
                this.position.z = this._j * tileSize + this.offsetPosition.z;
                this.refreshWorldMatrix();
                this.update(0);
                this.refreshWorldAABB();
                this.machine.requestUpdateShadow = true;
            }
        }
        public setTargetJ(v: number, doNotCheckGridLimits?: boolean): void {
            this._targetJ = v;
            if (!doNotCheckGridLimits && this.game.mode === GameMode.Challenge) {
                let j = Nabu.MinMax(this._targetJ, this.game.gridJMin - Nabu.RoundTowardZero(this.localRotatedAABBMin.z / tileSize), this.game.gridJMax - Nabu.RoundTowardZero(this.localRotatedAABBMax.z / tileSize));
                if (isFinite(j)) {
                    this._targetJ = j;
                }
            }
        }

        private _k: number = 0;
        private _targetK: number;
        public get k(): number {
            return this._k;
        }
        public get kAfterUpdate(): number {
            if (isFinite(this._targetK)) {
                return this._targetK;
            }
            return this._k;
        }
        public setK(v: number, doNotCheckGridLimits?: boolean) {
            if (this._k != v) {
                this._k = v;
                if (!doNotCheckGridLimits && this.game.mode === GameMode.Challenge) {
                    let k = Math.min(this._k, this.game.gridKMax - Nabu.RoundTowardZero(this.localRotatedAABBMax.y / tileHeight));
                    k = Math.max(k, this.game.gridKMin - Nabu.RoundTowardZero(this.localRotatedAABBMin.y / tileHeight))
                    if (isFinite(k)) {
                        this._k = k;
                    }
                }
                else {
                    let k = Math.max(this._k, 0 - Nabu.RoundTowardZero(this.localRotatedAABBMin.y / tileHeight));
                    if (isFinite(k)) {
                        this._k = k;
                    }
                }
                
                this.position.y = this._k * tileHeight + this.offsetPosition.y;
                this.refreshWorldMatrix();
                this.update(0);
                this.refreshWorldAABB();
                this.machine.requestUpdateShadow = true;
            }
        }
        public setTargetK(v: number, doNotCheckGridLimits?: boolean): void {
            this._targetK = v;
            if (!doNotCheckGridLimits && this.game.mode === GameMode.Challenge) {
                let k = Nabu.MinMax(this._targetK, this.game.gridKMin - Nabu.RoundTowardZero(this.localRotatedAABBMin.y / tileHeight), this.game.gridKMax - Nabu.RoundTowardZero(this.localRotatedAABBMax.y / tileHeight));
                if (isFinite(k)) {
                    this._targetK = k;
                }
            }
            else {
                let k = Math.max(this._targetK, 0 - Nabu.RoundTowardZero(this.localRotatedAABBMin.y / tileHeight));
                if (isFinite(k)) {
                    this._targetK = k;
                }
            }
        }

        private _r: number = 0;
        private _targetR: number;
        public get r(): number {
            return this._r;
        }
        public get rAfterUpdate(): number {
            if (isFinite(this._targetR)) {
                return this._targetR;
            }
            return this._r;
        }
        public setR(v: number, doNotCheckGridLimits?: boolean) {
            if (isFinite(v)) {
                while (v < 0) {
                    v += 4;
                }
                while (v >= 4) {
                    v -= 4;
                }
                if (this._r != v) {
                    this._r = v;
                    if (!doNotCheckGridLimits && this.game.mode === GameMode.Challenge) {
                        let r = this._r;
                        if (isFinite(r)) {
                            this._r = r;
                        }
                    }
                    this.rotation.y = - this._r * Math.PI * 0.5;
                    this.refreshWorldMatrix();
                    this.update(0);
                    this.refreshWorldAABB();
                    this.machine.requestUpdateShadow = true;
                }
            }
        }
        public get targetR(): number {
            return this._targetR;
        }
        public setTargetR(v: number): void {
            while (v < 0) {
                v += 4;
            }
            while (v >= 4) {
                v -= 4;
            }
            this._targetR = v;
        }
        public static DirectionToRValue(dir: BABYLON.Vector3): number {
            let a = - Mummu.AngleFromToAround(BABYLON.Axis.X, dir, BABYLON.Axis.Y) / (Math.PI * 0.5);
            return Math.round(a + 4) % 4;
        }

        public getAbsoluteCoordinatesPosition(): BABYLON.Vector3 {
            return new BABYLON.Vector3(
                this.i * tileSize + this.offsetPosition.x,
                this.k * tileHeight + this.offsetPosition.y,
                this.j * tileSize + this.offsetPosition.z
            )
        }

        public getAbsoluteAfterUpdateCoordinatesPosition(): BABYLON.Vector3 {
            return new BABYLON.Vector3(
                this.iAfterUpdate * tileSize + this.offsetPosition.x,
                this.kAfterUpdate * tileHeight + this.offsetPosition.y,
                this.jAfterUpdate * tileSize + this.offsetPosition.z
            )
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
        private _multiSelected: boolean = false;
        public get selected(): boolean {
            return this._selected;
        }
        public select(_multiSelected?: boolean): void {
            this._selected = true;
            this._multiSelected = _multiSelected;

            this.updateSelectorMeshVisibility();
        }

        public unselect(): void {
            this._selected = false;
            this._multiSelected = false;
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
                    this.setOutlineParams(true, 0.0015, new BABYLON.Color3(0.8, 0.8, 0.8));
                    this.selectorBodyDisplay.visibility = 0.2;
                }
                else if (this._hovered) {
                    this.setOutlineParams(true, 0.0015, new BABYLON.Color3(0.5, 0.5, 0.5));
                    this.selectorBodyDisplay.visibility = 0.1;
                }
                else {
                    this.setOutlineParams(false, 0.0015, new BABYLON.Color3(0.7, 0.7, 0.7));
                    this.selectorBodyDisplay.visibility = 0;
                }
                this.selectorBodyDisplay.visibility = 0;
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
                if (this._selected && !this._multiSelected && this.machine.constructionMode === MachineConstructionMode.Mode3D) {
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
            })
        }

        public setOutlineParams(renderOutline: boolean, outlineWidth: number, outlineColor: BABYLON.Color3): void {
            this.allWires.forEach(wire => {
                if (wire.wireMesh && !wire.wireMesh.isDisposed()) {
                    wire.wireMesh.renderOutline = renderOutline;
                    wire.wireMesh.outlineWidth = outlineWidth;
                    wire.wireMesh.outlineColor = outlineColor;
                }
            });
            this.outlinableMeshes.forEach(mesh => {
                if (mesh && !mesh.isDisposed()) {
                    mesh.renderOutline = renderOutline;
                    mesh.outlineWidth = outlineWidth;
                    mesh.outlineColor = outlineColor;
                }
            });
        }

        private _alignShadow = () => {
            if (this._selected && this.machine.constructionMode === MachineConstructionMode.Mode3D) {
                this.gridRectMesh.position.x = this.position.x;
                this.gridRectMesh.position.y = - tileHeight * 0.5;
                this.gridRectMesh.position.z = this.position.z;
                this.gridRectMesh.rotation.y = this.rotation.y;
    
                let min = this.encloseStart.clone();
                let max = this.encloseEnd.clone();
                /*
                if (this.machine.constructionMode === MachineConstructionMode.Mode2D) {
                    min.z = - tileSize * 0.5;
                    max.z = tileSize * 0.5;
                }
                */

                let points = [
                    new BABYLON.Vector3(min.x, 0, min.z),
                    new BABYLON.Vector3(max.x, 0, min.z),
                    new BABYLON.Vector3(max.x, 0, max.z),
                    new BABYLON.Vector3(min.x, 0, max.z)
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
                ]
                let camRight = this._scene.activeCamera.getDirection(BABYLON.Axis.X);
                let bestDir = 0;
                let dots = dirs.map(d => { return BABYLON.Vector3.Dot(d, camRight) });
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
                    let low = new BABYLON.Vector3(points[i % 4].x, - tileHeight * 0.5, points[i % 4].z);
                    let high = new BABYLON.Vector3(points[i % 4].x, this.position.y + this.encloseStart.y, points[i % 4].z);

                    lines.push([low, high]);
                    
                    let l = Math.round((high.y - low.y) / (tileHeight * 0.5));
                    let d = dirs[bestDir];
                    for (let j = 1; j < l; j++) {
                        let p = low.clone();
                        p.y += j * tileHeight * 0.5;
        
                        let r = j % 2 === 0 ? 0.005 : 0.0025;
                        if (i > bestDir) {
                            r *= - 1;
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
        }

        public getDirAndUpAtWorldPos(worldPosition: BABYLON.Vector3): { dir: BABYLON.Vector3, up: BABYLON.Vector3 } {
            let dir = BABYLON.Vector3.Right();
            let up = BABYLON.Vector3.Up();

            return { dir: dir, up: up };
        }
        public getProjection(worldPosition: BABYLON.Vector3, outProj: BABYLON.Vector3, outDir: BABYLON.Vector3, outUp: BABYLON.Vector3): void {
            let localPosition = BABYLON.Vector3.TransformCoordinates(worldPosition, this.getWorldMatrix().clone().invert());
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
                    outProj.copyFrom(point);
                    outUp.copyFrom(normal);
                    outDir.copyFrom(dir);

                    BABYLON.Vector3.TransformCoordinatesToRef(outProj, this.getWorldMatrix(), outProj);
                    BABYLON.Vector3.TransformNormalToRef(outUp, this.getWorldMatrix(), outUp);
                    BABYLON.Vector3.TransformNormalToRef(outDir, this.getWorldMatrix(), outDir);
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

        public onBeforeApplyingSelectorMeshLogicVertexData(selectorMeshLogicVertexDatas: BABYLON.VertexData[]): void {}

        public instantiated = false;
        public async instantiate(rebuildNeighboursWireMeshes?: boolean, skipSleepersAndSupport?: boolean): Promise<void> {
            this.instantiated = false;

            let selectorHullShapeLogicR = 0.012 * (IsTouchScreen === 1 ? 2 : 1);
            let selectorHullShapeLogic: BABYLON.Vector3[] = [];
            for (let i = 0; i < 6; i++) {
                let a = (i / 6) * 2 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                selectorHullShapeLogic[i] = (new BABYLON.Vector3(cosa * selectorHullShapeLogicR, sina * selectorHullShapeLogicR, 0));
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
                if (this.tracks[n].template.isPipeOrWood) {
                    let normals = this.tracks[n].trackInterpolatedNormals;
                    points = points.map((pt, i) => {
                        return pt.add(normals[i].scale(0.008));
                    });
                }
                Mummu.DecimatePathInPlace(points, (4 / 180) * Math.PI);

                if (Tools.IsWorldPosAConnexion(this.tracks[n].templateInterpolatedPoints[0])) {
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
                        let endpointLogicVertexData = BABYLON.CreateSphereVertexData({ segments: 12, diameter: 2 * selectorHullShapeLogicR - 0.001 });
                        Mummu.ColorizeVertexDataInPlace(endpointLogicVertexData, BABYLON.Color3.Magenta());
                        endpointLogicVertexData.applyToMesh(selectorOriginMeshLogic);
                        this.selectorEndpointsLogic.push(selectorOriginMeshLogic);
                    }
                }

                if (Tools.IsWorldPosAConnexion(this.tracks[n].templateInterpolatedPoints[this.tracks[n].templateInterpolatedPoints.length - 1])) {
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
                        let endpointLogicVertexData = BABYLON.CreateSphereVertexData({ segments: 12, diameter: 2 * selectorHullShapeLogicR - 0.001 });
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
            this.onBeforeApplyingSelectorMeshLogicVertexData(selectorMeshLogicVertexDatas);
            if (selectorMeshLogicVertexDatas.length > 0) {
                Mummu.MergeVertexDatas(...selectorMeshLogicVertexDatas).applyToMesh(this.selectorBodyLogic);
            }
            this.selectorBodyLogic.visibility = DEBUG_logicColliderVisibility;

            this.refreshEncloseMeshAndLocalAABB();

            if (this.machine.geometryQ > GeometryQuality.Proxy) {
                await this.instantiateMachineSpecific();
            }

            this.rebuildWireMeshes(rebuildNeighboursWireMeshes, skipSleepersAndSupport);

            this.refreshWorldMatrix();
            this.machine.requestUpdateShadow = true;
            this.instantiated = true;
        }

        protected async instantiateMachineSpecific(): Promise<void> {}
        protected onPositionChanged(): void {}

        public refreshEncloseMeshAndLocalAABB(): void {
            if (this.encloseMesh) {
                this.encloseMesh.dispose();
            }
            if (this.gridRectMesh) {
                this.gridRectMesh.dispose();
            }

            let x0 = - this.wireGauge * 0.5;
            let y0 = - this.wireGauge * 0.5;
            let z0 = - this.wireGauge * 0.5;
            let x1 = this.wireGauge * 0.5;
            let y1 = this.wireGauge * 0.5;
            let z1 = this.wireGauge * 0.5;

            for (let i = 0; i < this.tracks.length; i++) {
                let track = this.tracks[i];
                for (let j = 0; j < track.template.trackpoints.length; j++){
                    let trackpoint = track.template.trackpoints[j];

                    let dx = 0;
                    let dy = this.wireGauge * 0.5;
                    let dz = this.wireGauge * 0.5;
                    if (trackpoint.dir) {
                        if (Math.abs(trackpoint.dir.y) > 0.5) {
                            dx = this.wireGauge * 0.5
                            dy = this.wireGauge * 0.5;
                            dz = this.wireGauge * 0.5;
                        }
                        if (Math.abs(trackpoint.dir.z) > Math.abs(trackpoint.dir.x)) {
                            dx = this.wireGauge * 0.5
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

            x0 = Math.round((x0 - tileSize * 0.5) / tileSize) * tileSize + tileSize * 0.5;
            x1 = Math.round((x1 + tileSize * 0.5) / tileSize) * tileSize - tileSize * 0.5;
            y0 = Math.round((y0 - tileHeight * 0.5) / tileHeight) * tileHeight + tileHeight * 0.5;
            y1 = Math.round((y1 + tileHeight * 0.5) / tileHeight) * tileHeight - tileHeight * 0.5;
            z0 = Math.round((z0 - tileSize * 0.5) / tileSize) * tileSize + tileSize * 0.5;
            z1 = Math.round((z1 + tileSize * 0.5) / tileSize) * tileSize - tileSize * 0.5;

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

            let min = this.encloseStart.clone();
            let max = this.encloseEnd.clone();
            let thickness = 0.001;
            if (this.machine.constructionMode === MachineConstructionMode.Mode3D) {
                let encloseMeshVertexData = Tools.Box9SliceVertexData(min, max, thickness);
                encloseMeshVertexData.applyToMesh(this.encloseMesh);
            }
            else if (this.machine.constructionMode === MachineConstructionMode.Mode2D) {
                let encloseMeshVertexData = Mummu.Create9SliceVertexData({
                    width: max.x - min.x + tileSize * 0.1,
                    height: max.y - min.y + tileSize * 0.1,
                    margin: tileSize * 0.1
                });
                Mummu.TranslateVertexDataInPlace(encloseMeshVertexData, max.add(min).scale(0.5));
                encloseMeshVertexData = Mummu.MergeVertexDatas(encloseMeshVertexData, Mummu.TriFlipVertexDataInPlace(Mummu.CloneVertexData(encloseMeshVertexData)));
                encloseMeshVertexData.applyToMesh(this.encloseMesh);
            }

            this.encloseMesh.material = this.game.materials.slice9Cutoff;
            this.encloseMesh.parent = this;
            this.encloseMesh.visibility = 0;

            this.gridRectMesh = new BABYLON.Mesh("grid-rect-mesh");
            let points = [
                new BABYLON.Vector3(min.x, 0, min.z),
                new BABYLON.Vector3(min.x, 0, max.z),
                new BABYLON.Vector3(max.x, 0, max.z),
                new BABYLON.Vector3(max.x, 0, min.z)
            ];
            points = Mummu.BevelClosedPath(points, 0.001);
            points = Mummu.BevelClosedPath(points, 0.0003);
            let gridRectVertexData = Mummu.CreateWireVertexData({ path: points, radius: 0.0005, closed: true });
            gridRectVertexData.applyToMesh(this.gridRectMesh);
            this.gridRectMesh.material = this.game.materials.whiteFullLitMaterial;
            
            this.gridRectMesh.isVisible = false;

            this.localAABBMin.copyFromFloats(this.encloseStart.x, this.encloseStart.y, this.encloseStart.z);
            this.localAABBMax.copyFromFloats(this.encloseEnd.x, this.encloseEnd.y, this.encloseEnd.z);
            if (this.tracks[0] && this.tracks[0].template.isWood) {
                this.localAABBMax.y += tileSize;
            }

            this.visibleWidth = Math.round((this.localAABBMax.x - this.localAABBMin.x) / tileSize);
            this.visibleHeight = Math.round((this.localAABBMax.y - this.localAABBMin.y) / tileHeight);
            this.visibleDepth = Math.round((this.localAABBMax.z - this.localAABBMin.z) / tileSize);

            this.localBarycenter = new BABYLON.Vector3(
                (this.localAABBMax.x + this.localAABBMin.x) * 0.5,
                (this.localAABBMax.y + this.localAABBMin.y) * 0.5,
                (this.localAABBMax.z + this.localAABBMin.z) * 0.5
            );

            if (this.visibleWidth % 2 === 0) {
                this.localBarycenterIJK.x = Math.floor(this.localBarycenter.x / tileSize);
            }
            else {
                this.localBarycenterIJK.x = Math.round(this.localBarycenter.x / tileSize);
            }

            this.localBarycenterIJK.y = Math.round(this.localBarycenter.y / tileHeight);
            
            if (this.visibleDepth % 2 === 0) {
                this.localBarycenterIJK.z = Math.ceil(this.localBarycenter.z / tileSize);
            }
            else {
                this.localBarycenterIJK.z = Math.round(this.localBarycenter.z / tileSize);
            }

            this.refreshWorldAABB();
        }

        public refreshWorldAABB(): void {
            let aabb1 = BABYLON.Vector3.TransformNormal(this.localAABBMin, this.getWorldMatrix());
            let aabb2 = BABYLON.Vector3.TransformNormal(this.localAABBMax, this.getWorldMatrix());

            this.localRotatedAABBMin = BABYLON.Vector3.Minimize(aabb1, aabb2);
            this.localRotatedAABBMax = BABYLON.Vector3.Maximize(aabb1, aabb2);

            this.worldAABBMin.copyFrom(this.localRotatedAABBMin).addInPlace(this.position);
            this.worldAABBMax.copyFrom(this.localRotatedAABBMax).addInPlace(this.position);

            this.machine.requestUpdateBaseMesh = true;
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
                        else if (this.template.trackTemplates[i].isWood) {
                            track = new WoodTrack(this);
                        }
                        else {
                            track = new Track(this);
                        }
                        this.tracks[i] = track;
                    }
                    track.initialize(this.template.trackTemplates[i]);
                    track.refreshStartEndWorldPosition();
                    this.allWires.push(track.wires[0], track.wires[1]);
                }
            } else {
                console.error("Can't generate wires, no template provided for " + this.partName);
                console.log(this);
            }
        }

        public updateTargetCoordinates(dt: number): boolean {
            if (this.instantiated && isFinite(this._targetI) || isFinite(this._targetJ) || isFinite(this._targetK) || isFinite(this._targetR)) {
                let f = Nabu.Easing.smoothNSec(1 / dt, 0.15);
                let tI = isFinite(this._targetI) ? this._targetI : this.i;
                let tJ = isFinite(this._targetJ) ? this._targetJ : this.j;
                let tK = isFinite(this._targetK) ? this._targetK : this.k;
                let tR = isFinite(this._targetR) ? this._targetR : this.r;

                let targetPosition = new BABYLON.Vector3(
                    tI * tileSize + this.offsetPosition.x,
                    tK * tileHeight + this.offsetPosition.y,
                    tJ * tileSize + this.offsetPosition.z
                )
                let targetRotationY = - tR * Math.PI * 0.5;

                let dist = BABYLON.Vector3.Distance(this.position, targetPosition) + Math.abs(Nabu.AngularDistance(this.rotation.y, targetRotationY));
                if (dist < 0.0001 || f < 0.6) {
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
                    
                    this.refreshWorldAABB();
                    this.rebuildWireMeshesIfNeeded().then(() => {
                        this.updateSelectorMeshVisibility();
                    });
                    this.machine.requestUpdateBaseMesh = true;
                    this.machine.requestUpdateShadow = true;
                }
                else {
                    if (this.targetUpdatePivot) {
                        let v0 = this.position.subtract(this.targetUpdatePivot);
                        let y0 = v0.y;
                        v0.y = 0;
                        let l0 = v0.length();
                        if (l0 > 0) {
                            v0.scaleInPlace(1 / l0);

                            let v1 = targetPosition.subtract(this.targetUpdatePivot);
                            let y1 = v1.y;
                            v1.y = 0;
                            let l1 = v1.length();
                            if (l1 > 0) {
                                v1.scaleInPlace(1 / l1);

                                let v = BABYLON.Vector3.One();
                                BABYLON.Vector3.SlerpToRef(v0, v1, 1 - f, v);
                                let l = l0 * f + l1 * (1 - f);
                                v.normalize().scaleInPlace(l);

                                v.y = y0 * f + y1 * (1 - f);
                                this.position.copyFrom(v).addInPlace(this.targetUpdatePivot);
                            }
                            else {
                                BABYLON.Vector3.LerpToRef(this.position, targetPosition, 1 - f, this.position);
                            }
                        }
                        else {
                            BABYLON.Vector3.LerpToRef(this.position, targetPosition, 1 - f, this.position);
                        }
                    }
                    else {
                        BABYLON.Vector3.LerpToRef(this.position, targetPosition, 1 - f, this.position);
                    }

                    this.rotation.y = Nabu.LerpAngle(this.rotation.y, targetRotationY, 1 - f);
                }
                this.refreshWorldMatrix();
                return true;
            }
            return false;
        }

        public update(dt: number): void {

        }

        public refreshWorldMatrix(): void {
            this.onPositionChanged();
            this.freezeWorldMatrix();
            this.getChildMeshes().forEach((m) => {
                m.freezeWorldMatrix();
            });
            this.tracks.forEach(track => { track.refreshStartEndWorldPosition(); });
        }

        public rebuildWireMeshes(rebuildNeighboursWireMeshes?: boolean, skipSleepersAndSupport?: boolean): void {
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
                else if (track instanceof WoodTrack) {
                    WoodTrackMeshBuilder.BuildWoodTrackMesh(track, {});
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

            if (!skipSleepersAndSupport) {
                requestAnimationFrame(() => {
                    this.doSleepersMeshUpdate();
                });
            }

            if (rebuildNeighboursWireMeshes) {
                neighboursToUpdate = this.neighbours.cloneAsArray();
                for (let i = 0; i < neighboursToUpdate.length; i++) {
                    neighboursToUpdate[i].rebuildWireMeshes();
                }
            }
            this.refreshWorldMatrix();
            this.tracks.forEach(track => { track.refreshStartEndWorldPosition(); });
            this.machine.requestUpdateShadow = true;
        }

        public async rebuildWireMeshesIfNeeded(): Promise<void> {
            let neighbours = this.neighbours.cloneAsArray();
            let connections = [];
            this.endPoints.forEach(ep => {
                if (ep.connectedEndPoint) {
                    connections.push(true);
                }
                else {
                    connections.push(false);
                }
            })
            await Nabu.Wait(2);

            let newNeighbours = [];
            let newConnections = connections.map(v => { return false; });
            for (let i = 0; i < this.tracks.length; i++) {
                let track = this.tracks[i];
                let otherEndpoint = this.machine.getBankAt(track.startWorldPosition, this);
                if (otherEndpoint) {
                    if (newNeighbours.indexOf(otherEndpoint.part) === - 1) {
                        newNeighbours.push(otherEndpoint.part);
                        let thisEndpointIndex = this.findEndPointIndexByWorldPos(track.startWorldPosition);
                        if (thisEndpointIndex > -1) {
                            newNeighbours[thisEndpointIndex] = true;
                        }
                    }
                }
                otherEndpoint = this.machine.getBankAt(track.endWorldPosition, this);
                if (otherEndpoint) {
                    if (newNeighbours.indexOf(otherEndpoint.part) === - 1) {
                        newNeighbours.push(otherEndpoint.part);
                        let thisEndpointIndex = this.findEndPointIndexByWorldPos(track.startWorldPosition);
                        if (thisEndpointIndex > -1) {
                            newNeighbours[thisEndpointIndex] = true;
                        }
                    }
                }
            }

            let doRebuildWireMeshes = newNeighbours.length != neighbours.length;
            for (let i = 0; i < neighbours.length && !doRebuildWireMeshes; i++) {
                doRebuildWireMeshes = doRebuildWireMeshes && (neighbours[i] != newNeighbours[i]);
            }
            for (let i = 0; i < connections.length && !doRebuildWireMeshes; i++) {
                doRebuildWireMeshes = doRebuildWireMeshes && (connections[i] != newConnections[i]);
            }

            if (doRebuildWireMeshes) {
                this.rebuildWireMeshes(true);
            }
            else {
                this.refreshWorldMatrix();
                this.tracks.forEach((track) => {
                    track.recomputeWiresPath();
                    track.recomputeAbsolutePath();
                });
                this.machine.requestUpdateShadow = true;

                requestAnimationFrame(() => {
                    this.doSleepersMeshUpdate();
                });
            }
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
                sleeperMesh.material = this.game.materials.getMaterial(colorIndex, this.machine.materialQ);
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
