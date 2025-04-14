/// <reference path="../babylon.d.ts" />
/// <reference path="../nabu/nabu.d.ts" />
/// <reference path="../mummu/mummu.d.ts" />
declare namespace MarbleRunSimulatorCore {
    class BallGhost extends BABYLON.Mesh {
        ball: Ball;
        constructor(ball: Ball);
    }
    enum Surface {
        Rail = 0,
        Bowl = 1,
        Velvet = 2
    }
    enum CollisionState {
        Normal = 0,
        Inside = 1,
        Exit = 2,
        Flyback = 3
    }
    class Ball extends BABYLON.Mesh {
        positionZero: BABYLON.Vector3;
        machine: Machine;
        private _materialIndex;
        static ConstructorIndex: number;
        constructorIndex: number;
        get game(): IGame;
        size: number;
        get radius(): number;
        get volume(): number;
        get mass(): number;
        get sectionArea(): number;
        velocity: BABYLON.Vector3;
        private _boostAnimation;
        private _hasBoostMaterial;
        private _baseColor;
        private _boostColor;
        private _boosting;
        get boosting(): boolean;
        set boosting(v: boolean);
        useBoostingMaterial(): void;
        unuseBoostingMaterial(): void;
        rotationSpeed: number;
        rotationAxis: BABYLON.Vector3;
        surface: Surface;
        _showPositionZeroGhost: boolean;
        get showPositionZeroGhost(): boolean;
        setShowPositionZeroGhost(v: boolean): void;
        positionZeroGhost: BABYLON.Mesh;
        get materialIndex(): number;
        set materialIndex(v: number);
        setPositionZero(p: BABYLON.Vector3): void;
        get k(): number;
        set k(v: number);
        bumpSurfaceIsRail?: boolean;
        marbleChocSound: BABYLON.Sound;
        railBumpSound: BABYLON.Sound;
        marbleLoopSound: BABYLON.Sound;
        marbleBowlLoopSound: BABYLON.Sound;
        marbleInsideSound: BABYLON.Sound;
        flybackOrigin: BABYLON.Vector3;
        flybackDestination: BABYLON.Vector3;
        flybackPeak: BABYLON.Vector3;
        flyBackProgress: number;
        flyBackDuration: number;
        animatePosition: (target: BABYLON.Vector3, duration: number, overrideEasing?: (v: number) => number) => Promise<void>;
        constructor(positionZero: BABYLON.Vector3, machine: Machine, _materialIndex?: number);
        private _selected;
        select(): void;
        unselect(): void;
        private _hovered;
        hover(): void;
        anhover(): void;
        updateSelectorMeshVisibility(): void;
        setIsVisible(isVisible: boolean): void;
        instantiate(hotReload?: boolean): Promise<void>;
        dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void;
        reset(): void;
        private memCount;
        private _lastWires;
        private _lastWireIndexes;
        private _pouet;
        getLastIndex(wire: Wire): number;
        setLastHit(wire: Wire, index: number): void;
        debugNextYFlip: () => void;
        averageWithOptim: number;
        averageNoOptim: number;
        optimCount: number;
        totalCount: number;
        private _timer;
        strReaction: number;
        lastPosition: BABYLON.Vector3;
        visibleVelocity: BABYLON.Vector3;
        collisionState: number;
        recordedPositions: BABYLON.Vector3[];
        updateMaterial(rawDT: number): void;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class BallBoostAnimation extends BABYLON.Mesh {
        ball: Ball;
        private _duration;
        private _timer;
        shown: boolean;
        get instantiated(): boolean;
        rings: BABYLON.Mesh[];
        constructor(ball: Ball);
        instantiate(): void;
        uninstantiate(): void;
        update(rawDT: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    enum MaterialType {
        Plastic = 0,
        Metal = 1
    }
    enum BallMaterialType {
        Metal = 0,
        Logo = 1
    }
    class MainMaterials {
        game: IGame;
        private _materialsPBR;
        private _materialsSTD;
        getMaterial(colorIndex: number, materialQ: number): BABYLON.Material;
        getMaterialType(colorIndex: number): MaterialType;
        getBallMaterialType(colorIndex: number): BallMaterialType;
        getMaterialHexBaseColor(colorIndex: number, materialQ: number): string;
        getBallMaterialHexBaseColor(colorIndex: number, materialQ: number): string;
        get metalMaterialsCount(): number;
        private _ballMaterialsPBR;
        private _ballMaterialsSTD;
        private _parkourBallMaterialPBR;
        private _parkourBallMaterialSTD;
        getBallMaterial(colorIndex: number, materialQ: number): BABYLON.Material;
        getParkourBallMaterial(materialQ: number): BABYLON.Material;
        get ballMaterialsCount(): number;
        private baseMaterialToBallMaterialTable;
        ballMaterialIndexToBaseMaterialIndex(ballMaterialIndex: number): number;
        baseMaterialIndexToBallMaterialIndex(baseMaterialIndex: number): number;
        private _wallpapers;
        getWallpaperMaterial(index: number): BABYLON.Material;
        cableMaterial: BABYLON.Material;
        chainMaterial: BABYLON.Material;
        velvetMaterial: BABYLON.StandardMaterial;
        floorMaterial: BABYLON.StandardMaterial;
        logoMaterial: BABYLON.StandardMaterial;
        baseAxisMaterial: BABYLON.StandardMaterial;
        whiteMaterial: BABYLON.StandardMaterial;
        paintingLight: BABYLON.StandardMaterial;
        wallShadow: BABYLON.StandardMaterial;
        slice9Cutoff: BABYLON.StandardMaterial;
        groundMaterial: BABYLON.StandardMaterial;
        whiteGroundMaterial: BABYLON.StandardMaterial;
        handleMaterial: BABYLON.StandardMaterial;
        ghostMaterial: BABYLON.StandardMaterial;
        gridMaterial: BABYLON.StandardMaterial;
        cyanMaterial: BABYLON.StandardMaterial;
        redMaterial: BABYLON.StandardMaterial;
        greenMaterial: BABYLON.StandardMaterial;
        blueMaterial: BABYLON.StandardMaterial;
        ballAnimationMaterial: BABYLON.StandardMaterial;
        whiteAutolitMaterial: BABYLON.StandardMaterial;
        whiteFullLitMaterial: BABYLON.StandardMaterial;
        steelFullLitMaterial: BABYLON.StandardMaterial;
        copperFullLitMaterial: BABYLON.StandardMaterial;
        get plasticBlack(): BABYLON.Material;
        plasticWhite: BABYLON.StandardMaterial;
        bone: BABYLON.PBRMetallicRoughnessMaterial;
        selectorFullLitLightBlueMaterial: BABYLON.StandardMaterial;
        selectorFullLitBlueMaterial: BABYLON.StandardMaterial;
        selectorFullLitGreenMaterial: BABYLON.StandardMaterial;
        constructor(game: IGame);
        private _makePlasticPBR;
        private _makePlasticSTD;
        private _makeMetalPBR;
        private _makeMetalSTD;
        private _generateMaterials;
    }
}
declare namespace MarbleRunSimulatorCore {
    class MiniatureTrack {
        points: BABYLON.Vector3[];
        dist: number;
    }
    class MiniatureShape {
        points: BABYLON.Vector3[];
        dist: number;
        static MakeNGon(c: BABYLON.Vector3, r: number, axis: BABYLON.Vector3, n: number): MiniatureShape;
    }
}
declare namespace MarbleRunSimulatorCore {
}
declare namespace MarbleRunSimulatorCore {
    class Tools {
        static V3Dir(angleInDegrees: number, length?: number): BABYLON.Vector3;
        static IsWorldPosAConnexion(worldPos: BABYLON.Vector3): boolean;
        static Box9SliceVertexData(min: BABYLON.Vector3, max: BABYLON.Vector3, margin: number): BABYLON.VertexData;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Wire extends BABYLON.Mesh {
        part: MachinePart;
        static DEBUG_DISPLAY: boolean;
        path: BABYLON.Vector3[];
        normals: BABYLON.Vector3[];
        absolutePath: BABYLON.Vector3[];
        wireSize: number;
        get size(): number;
        get radius(): number;
        colorIndex: number;
        startTipCenter: BABYLON.Vector3;
        startTipNormal: BABYLON.Vector3;
        startTipDir: BABYLON.Vector3;
        endTipCenter: BABYLON.Vector3;
        endTipNormal: BABYLON.Vector3;
        endTipDir: BABYLON.Vector3;
        constructor(part: MachinePart);
        show(): void;
        hide(): void;
        recomputeAbsolutePath(): void;
        instantiate(color?: number): Promise<void>;
    }
}
declare var THE_ORIGIN_OF_TIME_ms: any;
declare var IsTouchScreen: number;
declare namespace MarbleRunSimulatorCore {
    function NToHex(n: number, l?: number): string;
    var ballOffset: number;
    var partOffset: number;
    enum GraphicQuality {
        Proxy = 0,
        VeryLow = 1,
        Low = 2,
        Medium = 3,
        High = 4,
        VeryHigh = 5
    }
    enum GeometryQuality {
        Proxy = 0,
        Low = 1,
        Medium = 2,
        High = 3
    }
    enum MaterialQuality {
        Standard = 0,
        PBR = 1
    }
    interface IGame {
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
    enum GameMode {
        Home = 0,
        Page = 1,
        Create = 2,
        Challenge = 3,
        Demo = 4,
        GravityControl = 5
    }
    interface IBallData {
        x: number;
        y: number;
        z?: number;
    }
    interface IMachinePartData {
        name: string;
        i: number;
        j: number;
        k?: number;
        mirrorX?: boolean;
        mirrorZ?: boolean;
        c?: number | number[];
    }
    interface IMachineData {
        n?: string;
        name?: string;
        a?: string;
        sleepers?: ISleeperMeshProps;
        balls?: IBallData[];
        parts?: IMachinePartData[];
        d?: string;
        r?: number;
        sp?: ISleeperMeshProps;
        v?: number;
        title?: string;
        author?: string;
        content?: string;
    }
    class Machine {
        game: IGame;
        name: string;
        author: string;
        isChallengeMachine: boolean;
        root: BABYLON.Mesh;
        pedestalTop: BABYLON.Mesh;
        baseFrame: BABYLON.Mesh;
        baseLogo: BABYLON.Mesh;
        TEST_USE_BASE_FPS: boolean;
        baseFPS: BABYLON.Mesh;
        fpsMaterial: BABYLON.StandardMaterial;
        fpsTexture: BABYLON.DynamicTexture;
        baseAxis: BABYLON.Mesh;
        parts: MachinePart[];
        decors: MachineDecor[];
        balls: Ball[];
        debugAxis: BABYLON.LinesMesh;
        sleepersMeshProp: ISleeperMeshProps;
        trackFactory: MachinePartFactory;
        templateManager: TemplateManager;
        sleeperVertexData: BABYLON.VertexData[];
        ready: boolean;
        instantiated: boolean;
        hasBeenOpenedInEditor: boolean;
        minimalAutoQualityFailed: number;
        updatingMachinePartCoordinates: boolean;
        playing: boolean;
        hasExitHole: boolean;
        exitShooter: Shooter;
        exitTrack: Start;
        exitHoleIn: BABYLON.Mesh;
        exitHolePath: BABYLON.Vector3[];
        exitHoleOut: BABYLON.Mesh;
        baseColor: string;
        _roomIndex: number;
        get roomIndex(): number;
        setRoomIndex(roomIndex: number): void;
        graphicQ: GraphicQuality;
        get geometryQ(): GeometryQuality;
        get materialQ(): MaterialQuality;
        constructor(game: IGame);
        setAllIsSelectable(isSelectable: boolean): void;
        instantiate(hotReload?: boolean): Promise<void>;
        reset(): void;
        dispose(): void;
        getBallPos(): any;
        applyBallPos(save: any): void;
        update(): void;
        onPlayCallbacks: Nabu.UniqueList<() => void>;
        play(): void;
        private _paused;
        get paused(): boolean;
        pause(): void;
        onStopCallbacks: Nabu.UniqueList<() => void>;
        get stopped(): boolean;
        stop(): void;
        margin: number;
        baseMeshMinX: number;
        baseMeshMaxX: number;
        baseMeshMinY: number;
        baseMeshMaxY: number;
        baseMeshMinZ: number;
        baseMeshMaxZ: number;
        tracksMinX: number;
        tracksMaxX: number;
        tracksMinY: number;
        tracksMaxY: number;
        tracksMinZ: number;
        tracksMaxZ: number;
        generateBaseMesh(): Promise<void>;
        regenerateBaseAxis(): void;
        setBaseIsVisible(v: boolean): void;
        getBankAt(pos: BABYLON.Vector3, exclude: MachinePart): {
            isEnd: boolean;
            bank: number;
            part: MachinePart;
            pipeTrack: boolean;
        };
        static MachineDataCompare(d1: IMachineData, d2: IMachineData): boolean;
        serialize(): IMachineData;
        static MakeMiniature(machine: Machine, data: IMachineData): HTMLCanvasElement;
        lastDeserializedData: IMachineData;
        deserialize(data: IMachineData, makeMiniature?: boolean): void;
        getEncloseStart(): BABYLON.Vector3;
        getEncloseEnd(): BABYLON.Vector3;
        requestUpdateBaseMesh: boolean;
        requestUpdateShadow: boolean;
        updateShadow(): void;
    }
}
declare class MachineName {
    static PartOnes: string[];
    static PartTwos: string[];
    static PartThrees: string[];
    static PartFours: string[];
    static GetRandom(): string;
}
declare namespace MarbleRunSimulatorCore {
    var tileSize: number;
    var tileWidth: number;
    var legacyTileHeight: number;
    var tileHeight: number;
    var legacyTileDepth: number;
    var tileDepth: number;
    var colorSlotsCount: number;
    enum PartVisibilityMode {
        Default = 0,
        Selected = 1,
        Ghost = 2
    }
    interface ITrackPointData {
        position: {
            x: number;
            y: number;
            z: number;
        };
        normal?: {
            x: number;
            y: number;
            z: number;
        };
        dir?: {
            x: number;
            y: number;
            z: number;
        };
        tangentIn?: number;
        tangentOut?: number;
    }
    interface ITrackData {
        points: ITrackPointData[];
    }
    class MachinePartSelectorMesh extends BABYLON.Mesh {
        part: MachinePart;
        constructor(part: MachinePart);
    }
    class EndpointSelectorMesh extends BABYLON.Mesh {
        endpoint: MachinePartEndpoint;
        constructor(endpoint: MachinePartEndpoint);
    }
    class MachinePartEndpoint {
        localPosition: BABYLON.Vector3;
        localR: number;
        machinePart: MachinePart;
        connectedEndPoint: MachinePartEndpoint;
        i: number;
        j: number;
        k: number;
        index: number;
        selectorMeshDisplay: BABYLON.Mesh;
        helperMesh: BABYLON.Mesh;
        constructor(localPosition: BABYLON.Vector3, localR: number, machinePart: MachinePart);
        get leftSide(): boolean;
        get upperSide(): boolean;
        get farSide(): boolean;
        get isOrigin(): boolean;
        isIJK(worldIJK: Nabu.IJK): boolean;
        private _absolutePosition;
        get absolutePosition(): BABYLON.Vector3;
        getRotatedI(r: number): number;
        getRotatedJ(r: number): number;
        get absoluteR(): number;
        get absoluteRAfterUpdate(): number;
        connectTo(endPoint: MachinePartEndpoint): void;
        disconnect(): void;
        private _hovered;
        hover(): void;
        anhover(): void;
        updateSelectorMeshVisibility(): void;
        showHelperMesh(): void;
        hideHelperMesh(): void;
        updateHelperMesh(mode: number, color: number, timer: number): void;
    }
    class MachinePart extends BABYLON.Mesh {
        machine: Machine;
        isPlaced: boolean;
        fullPartName: string;
        get partName(): string;
        get game(): IGame;
        tracks: Track[];
        wires: Wire[];
        allWires: Wire[];
        wireSize: number;
        wireGauge: number;
        colors: number[];
        getColor(index: number): number;
        sleepersMeshes: Map<number, BABYLON.Mesh>;
        selectorBodyDisplay: BABYLON.Mesh;
        selectorBodyLogic: MachinePartSelectorMesh;
        selectorEndpointsDisplay: BABYLON.Mesh[];
        selectorEndpointsLogic: EndpointSelectorMesh[];
        encloseMesh: BABYLON.Mesh;
        gridRectMesh: BABYLON.Mesh;
        gridHeightMesh: BABYLON.LinesMesh;
        isSelectable: boolean;
        onBeforeDelete: () => void;
        summedLength: number[];
        totalLength: number;
        globalSlope: number;
        localBarycenter: BABYLON.Vector3;
        localBarycenterIJK: BABYLON.Vector3;
        AABBMin: BABYLON.Vector3;
        AABBMax: BABYLON.Vector3;
        visibleWidth: number;
        visibleHeight: number;
        visibleDepth: number;
        encloseStart: BABYLON.Vector3;
        enclose13: BABYLON.Vector3;
        encloseMid: BABYLON.Vector3;
        enclose23: BABYLON.Vector3;
        encloseEnd: BABYLON.Vector3;
        localCenter: BABYLON.Vector3;
        endPoints: MachinePartEndpoint[];
        findEndPoint(localPosition: BABYLON.Vector3): MachinePartEndpoint;
        neighbours: Nabu.UniqueList<MachinePart>;
        addNeighbour(other: MachinePart): void;
        removeNeighbour(other: MachinePart): void;
        removeAllNeighbours(): void;
        get isRightConnected(): boolean;
        get isUpConnected(): boolean;
        get isDownConnected(): boolean;
        get isBackConnected(): boolean;
        decors: MachineDecor[];
        attachDecor(decor: MachineDecor): void;
        detachDecor(decor: MachineDecor): void;
        get l(): number;
        get w(): number;
        get h(): number;
        get d(): number;
        get n(): number;
        get s(): number;
        get mirrorX(): boolean;
        get mirrorZ(): boolean;
        get lExtendableOnX(): boolean;
        get lExtendableOnXZ(): boolean;
        get lExtendableOnZ(): boolean;
        get hExtendableOnY(): boolean;
        get dExtendableOnZ(): boolean;
        get extendable(): boolean;
        get xExtendable(): boolean;
        get yExtendable(): boolean;
        get downwardYExtendable(): boolean;
        get zExtendable(): boolean;
        get nExtendable(): boolean;
        get sExtendable(): boolean;
        get minL(): number;
        get maxL(): number;
        get minLAbsolute(): number;
        get minW(): number;
        get maxW(): number;
        get minH(): number;
        get maxH(): number;
        get minD(): number;
        get maxD(): number;
        get minDAbsolute(): number;
        get minN(): number;
        get maxN(): number;
        get minS(): number;
        get maxS(): number;
        get xMirrorable(): boolean;
        get zMirrorable(): boolean;
        get hasOriginDestinationHandles(): boolean;
        getIsNaNOrValidWHD(w?: number, h?: number, d?: number): boolean;
        private _template;
        get template(): MachinePartTemplate;
        setTemplate(template: MachinePartTemplate): void;
        sleepersMeshProp: ISleeperMeshProps;
        constructor(machine: Machine, prop: IMachinePartProp, isPlaced?: boolean);
        static PropToPartName(prop: IMachinePartProp): string;
        offsetPosition: BABYLON.Vector3;
        targetUpdatePivot: BABYLON.Vector3;
        private _i;
        private _targetI;
        get i(): number;
        get iAfterUpdate(): number;
        setI(v: number, doNotCheckGridLimits?: boolean): void;
        setTargetI(v: number): void;
        private _j;
        private _targetJ;
        get j(): number;
        get jAfterUpdate(): number;
        setJ(v: number, doNotCheckGridLimits?: boolean): void;
        setTargetJ(v: number): void;
        private _k;
        private _targetK;
        get k(): number;
        get kAfterUpdate(): number;
        setK(v: number, doNotCheckGridLimits?: boolean): void;
        setTargetK(v: number): void;
        private _r;
        private _targetR;
        get r(): number;
        get rAfterUpdate(): number;
        setR(v: number, doNotCheckGridLimits?: boolean): void;
        get targetR(): number;
        setTargetR(v: number): void;
        static DirectionToRValue(dir: BABYLON.Vector3): number;
        getAbsoluteCoordinatesPosition(): BABYLON.Vector3;
        setIsVisible(isVisible: boolean): void;
        private _partVisibilityMode;
        get partVisilibityMode(): PartVisibilityMode;
        set partVisibilityMode(v: PartVisibilityMode);
        private _selected;
        private _multiSelected;
        get selected(): boolean;
        select(_multiSelected?: boolean): void;
        unselect(): void;
        private _hovered;
        hover(): void;
        anhover(): void;
        updateSelectorMeshVisibility(): void;
        private _alignShadow;
        getDirAndUpAtWorldPos(worldPosition: BABYLON.Vector3): {
            dir: BABYLON.Vector3;
            up: BABYLON.Vector3;
        };
        getProjection(worldPosition: BABYLON.Vector3, outProj: BABYLON.Vector3, outDir: BABYLON.Vector3, outUp: BABYLON.Vector3): void;
        getSlopeAt(index: number, trackIndex?: number): number;
        getBankAt(index: number, trackIndex?: number): number;
        getBarycenter(): BABYLON.Vector3;
        recomputeAbsolutePath(): void;
        instantiated: boolean;
        instantiate(rebuildNeighboursWireMeshes?: boolean): Promise<void>;
        protected instantiateMachineSpecific(): Promise<void>;
        refreshEncloseMeshAndAABB(): void;
        dispose(): void;
        generateWires(): void;
        private _lastDist;
        updateTargetCoordinates(dt: number): boolean;
        update(dt: number): void;
        rebuildWireMeshes(rebuildNeighboursWireMeshes?: boolean): void;
        doSleepersMeshUpdate(): void;
        getTriCount(): number;
    }
}
declare namespace MarbleRunSimulatorCore {
    var TrackNames: string[];
    interface IMachinePartProp {
        fullPartName?: string;
        i?: number;
        j?: number;
        k?: number;
        r?: number;
        l?: number;
        h?: number;
        d?: number;
        n?: number;
        s?: number;
        c?: number[];
        mirrorX?: boolean;
        mirrorZ?: boolean;
        pipeVersion?: boolean;
        woodVersion?: boolean;
    }
    class MachinePartFactory {
        machine: Machine;
        constructor(machine: Machine);
        createTrackWHDN(trackname: string, props?: IMachinePartProp): MachinePart;
        createTrack(partName: string, prop: IMachinePartProp): MachinePart;
        createTrackBaseName(baseName: string, prop: IMachinePartProp): MachinePart;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Track {
        part: MachinePart;
        wires: Wire[];
        get templateInterpolatedPoints(): BABYLON.Vector3[];
        trackInterpolatedNormals: BABYLON.Vector3[];
        get preferedStartBank(): number;
        private _startWorldPosition;
        get startWorldPosition(): BABYLON.Vector3;
        get preferedEndBank(): number;
        private _endWorldPosition;
        get endWorldPosition(): BABYLON.Vector3;
        AABBMin: BABYLON.Vector3;
        AABBMax: BABYLON.Vector3;
        template: TrackTemplate;
        constructor(part: MachinePart);
        get trackIndex(): number;
        getSlopeAt(index: number): number;
        getBankAt(index: number): number;
        initialize(template: TrackTemplate): void;
        recomputeWiresPath(forceDisconnexion?: boolean): void;
        recomputeAbsolutePath(): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class PipeTrack extends Track {
        mesh: BABYLON.Mesh;
        tubePath: BABYLON.Vector3[];
        get preferedStartBank(): number;
        get preferedEndBank(): number;
        AABBMin: BABYLON.Vector3;
        AABBMax: BABYLON.Vector3;
        constructor(part: MachinePart);
        get trackIndex(): number;
        getSlopeAt(index: number): number;
        getBankAt(index: number): number;
        initialize(template: TrackTemplate): void;
        recomputeWiresPath(forceDisconnexion?: boolean): void;
        recomputeAbsolutePath(): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    interface IPipeTrackMeshProps {
    }
    class PipeTrackMeshBuilder {
        static BuildPipeTrackMesh(track: PipeTrack, props: IPipeTrackMeshProps): Promise<void>;
    }
}
declare namespace MarbleRunSimulatorCore {
    interface ISleeperMeshProps {
        spacing?: number;
        drawWallAnchors?: boolean;
        grndAnchors?: boolean;
        grndAnchorsMaxY?: number;
        forceDrawWallAnchors?: boolean;
        forcedWallAnchorsZ?: number;
    }
    class SleeperMeshBuilder {
        static GenerateSleepersVertexData(part: MachinePart, props: ISleeperMeshProps): Map<number, BABYLON.VertexData>;
    }
}
declare namespace MarbleRunSimulatorCore {
    enum TrackSpeed {
        Flat = 0,
        Slow = 1,
        Medium = 2,
        Fast = 3
    }
    var TrackSpeedNames: string[];
    class TrackTemplate {
        partTemplate: MachinePartTemplate;
        trackpoints: TrackPoint[];
        interpolatedPoints: BABYLON.Vector3[];
        interpolatedNormals: BABYLON.Vector3[];
        angles: number[];
        drawStartTip: boolean;
        drawEndTip: boolean;
        forcedAngle: number;
        preferedStartBank: number;
        preferedEndBank: number;
        cutOutSleeper: (n: number) => boolean;
        colorIndex: number;
        isPipe: boolean;
        isWood: boolean;
        get isPipeOrWood(): boolean;
        summedLength: number[];
        totalLength: number;
        globalSlope: number;
        AABBMin: BABYLON.Vector3;
        AABBMax: BABYLON.Vector3;
        noMiniatureRender: boolean;
        constructor(partTemplate: MachinePartTemplate);
        mirrorXTrackPointsInPlace(): void;
        mirrorZTrackPointsInPlace(): void;
        onNormalEvaluated: (n: BABYLON.Vector3, p?: BABYLON.Vector3, relativeIndex?: number) => void;
        initialize(): void;
    }
    class MachinePartTemplate {
        partName: string;
        l: number;
        h: number;
        d: number;
        n: number;
        s: number;
        mirrorX: boolean;
        mirrorZ: boolean;
        angleSmoothSteps: number;
        defaultAngle: number;
        maxAngle: number;
        minTurnRadius: number;
        lExtendableOnX: boolean;
        lExtendableOnXZ: boolean;
        lExtendableOnZ: boolean;
        hExtendableOnY: boolean;
        dExtendableOnZ: boolean;
        xExtendable: boolean;
        yExtendable: boolean;
        downwardYExtendable: boolean;
        zExtendable: boolean;
        nExtendable: boolean;
        sExtendable: boolean;
        minLAbsolute: number;
        minL: number;
        maxL: number;
        minH: number;
        maxH: number;
        minDAbsolute: number;
        minD: number;
        maxD: number;
        minN: number;
        maxN: number;
        minS: number;
        maxS: number;
        xMirrorable: boolean;
        zMirrorable: boolean;
        hasOriginDestinationHandles: boolean;
        getWidthForDepth: (d: number) => number;
        getWidthForHeight: (h: number) => number;
        getDepthForWidth: (d: number) => number;
        trackTemplates: TrackTemplate[];
        endPoints: BABYLON.Vector3[];
        endPointDirections: BABYLON.Vector3[];
        miniatureExtraLines: MiniatureTrack[];
        miniatureShapes: MiniatureShape[];
        mirrorXTrackPointsInPlace(): void;
        mirrorZTrackPointsInPlace(): void;
        initialize(): void;
    }
    class TemplateManager {
        machine: Machine;
        private _dictionary;
        constructor(machine: Machine);
        getTemplate(partName: string, mirrorX?: boolean, mirrorZ?: boolean): MachinePartTemplate;
        getTemplateByProp(baseName: string, prop: IMachinePartProp): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class TrackPoint {
        template: TrackTemplate;
        position: BABYLON.Vector3;
        dir?: BABYLON.Vector3;
        normal?: BABYLON.Vector3;
        tangentIn?: number;
        tangentOut?: number;
        fixedNormal: boolean;
        fixedDir: boolean;
        fixedTangentIn: boolean;
        fixedTangentOut: boolean;
        summedLength: number;
        constructor(template: TrackTemplate, position: BABYLON.Vector3, dir?: BABYLON.Vector3, normal?: BABYLON.Vector3, tangentIn?: number, tangentOut?: number);
        setDir(dir: BABYLON.Vector3): void;
        isFirstOrLast(): boolean;
    }
}
declare namespace MarbleRunSimulatorCore {
    class WoodTrack extends Track {
        mesh: BABYLON.Mesh;
        tubeRadius: number;
        radiusToRaise(r: number): number;
        tubePath: BABYLON.Vector3[];
        get preferedStartBank(): number;
        get preferedEndBank(): number;
        AABBMin: BABYLON.Vector3;
        AABBMax: BABYLON.Vector3;
        constructor(part: MachinePart);
        get trackIndex(): number;
        getSlopeAt(index: number): number;
        getBankAt(index: number): number;
        initialize(template: TrackTemplate): void;
        recomputeWiresPath(forceDisconnexion?: boolean): void;
        recomputeAbsolutePath(): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    interface IWoodTrackMeshProps {
    }
    class WoodTrackMeshBuilder {
        static BuildWoodTrackMesh(track: WoodTrack, props: IWoodTrackMeshProps): Promise<void>;
    }
}
declare namespace MarbleRunSimulatorCore {
    function DrawMiniature(lines: (MiniatureTrack | MiniatureShape)[], canvas: HTMLCanvasElement): void;
}
declare namespace MarbleRunSimulatorCore {
    function SerializeV1(machine: Machine): IMachineData;
    function DeserializeV1(machine: Machine, data: IMachineData): void;
}
declare namespace MarbleRunSimulatorCore {
    function SerializeV11(machine: Machine): IMachineData;
    function DeserializeAnte11Fix(baseName: string, prop: IMachinePartProp): void;
    function DeserializeV11(machine: Machine, data: IMachineData, makeMiniature?: boolean): void;
}
declare namespace MarbleRunSimulatorCore {
    function SerializeV12(machine: Machine): IMachineData;
    function DeserializeV12(machine: Machine, data: IMachineData, makeMiniature?: boolean): void;
}
declare namespace MarbleRunSimulatorCore {
    function SerializeV2(machine: Machine): IMachineData;
    function DeserializeV2(machine: Machine, data: IMachineData): void;
}
declare namespace MarbleRunSimulatorCore {
    function SerializeV3456(machine: Machine, version: number): IMachineData;
    function DeserializeV3456(machine: Machine, data: IMachineData): void;
}
declare namespace MarbleRunSimulatorCore {
    function SerializeV8(machine: Machine): IMachineData;
    function DeserializeV78(machine: Machine, data: IMachineData): void;
}
declare namespace MarbleRunSimulatorCore {
    function SerializeV910(machine: Machine, version: number): IMachineData;
    function DeserializeV910(machine: Machine, data: IMachineData, makeMiniature?: boolean, canvas?: HTMLCanvasElement): void;
}
declare namespace MarbleRunSimulatorCore {
    class MachineDecorSelector extends BABYLON.Mesh {
        machineDecor: MachineDecor;
        constructor(machineDecor: MachineDecor, name: string);
    }
    abstract class MachineDecor extends BABYLON.Mesh {
        machine: Machine;
        decorName: string;
        isPlaced: boolean;
        protected _n: number;
        get n(): number;
        setN(v: number): void;
        onNSet(n: number): void;
        protected _flip: boolean;
        get flip(): boolean;
        setFlip(v: boolean): void;
        selectorMesh: MachineDecorSelector;
        setPosition(p: BABYLON.Vector3): void;
        setDirAndUp(dir: BABYLON.Vector3, up: BABYLON.Vector3): void;
        machinePart: MachinePart;
        attachMachinePart(machinePart: MachinePart): void;
        detachMachinePart(): void;
        findMachinePart(): void;
        constructor(machine: Machine, decorName: string);
        instantiated: boolean;
        instantiate(hotReload?: boolean): Promise<void>;
        dispose(): void;
        select(): void;
        unselect(): void;
        abstract instantiateSelectorMesh(): void;
        protected instantiateMachineDecorSpecific(): Promise<void>;
        onBallCollideAABB(ball: Ball): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    abstract class MachineDecorFactory {
        machine: Machine;
        constructor(machine: Machine);
        createDecor(name: string): MachineDecor;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Xylophone extends MachineDecor {
        static NotesName: string[];
        sound: BABYLON.Sound;
        trigger: BABYLON.Mesh;
        blade: BABYLON.Mesh;
        private _animateTrigger;
        private _animateTriggerBack;
        get noteLetterIndex(): number;
        constructor(machine: Machine);
        instantiateSelectorMesh(): void;
        protected instantiateMachineDecorSpecific(): Promise<void>;
        onNSet(n: number): void;
        sounding: boolean;
        onBallCollideAABB(ball: Ball): Promise<void>;
        onSoundPlay: () => void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Controler extends MachinePart {
        private _animatePivot;
        pivotPass: BABYLON.Mesh;
        pivotControler: BABYLON.Mesh;
        pivotControlerCollider: BABYLON.Mesh;
        support: BABYLON.Mesh;
        cog13: BABYLON.Mesh;
        cog8: BABYLON.Mesh;
        axisZMin: number;
        axisZMax: number;
        clicSound: BABYLON.Sound;
        static pivotL: number;
        constructor(machine: Machine, prop: IMachinePartProp);
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(mirrorX: boolean): MachinePartTemplate;
        dispose(): void;
        reset: () => void;
        private _moving;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Curb extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(l: number, h: number, s: number, pipeVersion?: boolean, woodVersion?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Elevator extends MachinePart {
        boxesCount: number;
        rWheel: number;
        boxX: number[];
        boxes: BABYLON.Mesh[];
        wheels: BABYLON.Mesh[];
        cable: BABYLON.Mesh;
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(h: number): MachinePartTemplate;
        dispose(): void;
        reset: () => void;
        baseCableUVs: number[];
        x: number;
        length: number;
        p: number;
        chainLength: number;
        speed: number;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class End extends MachinePart {
        panel: BABYLON.Mesh;
        panelSupport: BABYLON.Mesh;
        panelPicture: BABYLON.Mesh;
        constructor(machine: Machine, prop: IMachinePartProp);
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class FlatJoin extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class ForwardSplit extends MachinePart {
        private _animatePivot;
        anchor: BABYLON.Mesh;
        pivot: BABYLON.Mesh;
        axisZMin: number;
        axisZMax: number;
        clicSound: BABYLON.Sound;
        static pivotL: number;
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(mirrorZ: boolean): MachinePartTemplate;
        dispose(): void;
        reset: () => void;
        private _exitLeft;
        private _moving;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class GravityWell extends MachinePart {
        wellPath: BABYLON.Vector3[];
        wellMesh: BABYLON.Mesh;
        circleTop: BABYLON.Mesh;
        circleBottom: BABYLON.Mesh;
        constructor(machine: Machine, prop: IMachinePartProp);
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Join extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Jumper extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(n: number): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class LargeLoop extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(l: number, d: number, n: number): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Loop extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(l: number, d: number, n: number): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class MultiJoin extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(l: number, mirrorX: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Ramp extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(l: number, h: number, d: number, s: number, pipeVersion?: boolean, woodVersion?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Screen extends MachinePart {
        private _animatePivot;
        private _animateLock0;
        private _animateLock2;
        private _animateTingle2Out;
        container: BABYLON.Mesh;
        pixels: BABYLON.Mesh[];
        pixelPictures: BABYLON.Mesh[];
        lock0: BABYLON.Mesh;
        lock2: BABYLON.Mesh;
        value: number;
        came: BABYLON.Mesh;
        cameInCollider: BABYLON.Mesh;
        cameOutCollider: BABYLON.Mesh;
        cable: BABYLON.Mesh;
        turnLoopSound: BABYLON.Sound;
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        engraine12Up: boolean;
        engraine12Down: boolean;
        tingle2(pixel2Value: boolean, duration: number): Promise<void>;
        rotatePixels(origin: number, target: number, duration: number, easing?: (v: number) => number): Promise<void>;
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(): MachinePartTemplate;
        reset: () => void;
        isInside(ball: Ball): boolean;
        private _moving;
        get isMoving(): boolean;
        private _lastCamRotZ;
        private _visibleAngularSpeed;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Screw extends MachinePart {
        rotor: BABYLON.Mesh;
        screwWire: Wire;
        x0: number;
        x1: number;
        stepW: number;
        y0: number;
        y1: number;
        stepH: number;
        dH: number;
        dir: BABYLON.Vector3;
        shieldConnector: BABYLON.Mesh;
        shieldConnectorUp: BABYLON.Mesh;
        wheel: BABYLON.Mesh;
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(l: number, h: number): MachinePartTemplate;
        dispose(): void;
        reset: () => void;
        length: number;
        p: number;
        speed: number;
        a: number;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Shooter extends MachinePart {
        static velocityKicks: number[];
        velocityKick: number;
        kicker: BABYLON.Mesh;
        kickerCollider: BABYLON.Mesh;
        kickerBody: BABYLON.Mesh;
        kickerWeight: BABYLON.Mesh;
        kickerRadius: number;
        kickerLength: number;
        kickerYIdle: number;
        hasCollidingKicker: boolean;
        shield: BABYLON.Mesh;
        shieldCollider: BABYLON.Mesh;
        shieldYClosed: number;
        shieldLength: number;
        clicSound: BABYLON.Sound;
        base: BABYLON.Mesh;
        animateKickerArm: (target: number, duration: number, overrideEasing?: (v: number) => number) => Promise<void>;
        animateKickerKick: (target: number, duration: number, overrideEasing?: (v: number) => number) => Promise<void>;
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(h: number, n: number): MachinePartTemplate;
        dispose(): void;
        reset: () => void;
        get shieldOpened(): boolean;
        get shieldClosed(): boolean;
        getBallReady(): Ball;
        getBallArmed(): Ball;
        shieldClose: boolean;
        currentShootState: number;
        shieldSpeed: number;
        delayTimeout: number;
        update(dt: number): void;
        private _freezeKicker;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Snake extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(w: number, s: number, mirrorX?: boolean, mirrorZ?: boolean): MachinePartTemplate;
        recreateFromOriginDestination(origin: Nabu.IJK, dest: Nabu.IJK, machine: Machine): Snake;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Sort extends MachinePart {
        private _animatePivot;
        anchor: BABYLON.Mesh;
        pivot: BABYLON.Mesh;
        axisZMin: number;
        axisZMax: number;
        clicSound: BABYLON.Sound;
        static pivotL: number;
        panel: BABYLON.Mesh;
        panelSupport: BABYLON.Mesh;
        panelPicture: BABYLON.Mesh;
        constructor(machine: Machine, prop: IMachinePartProp);
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(mirrorX: boolean, mirrorZ: boolean): MachinePartTemplate;
        dispose(): void;
        reset: () => void;
        private _moving;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Spawner extends MachinePart {
        private _animatePivot;
        pivotPass: BABYLON.Mesh;
        pivotSpawner: BABYLON.Mesh;
        pivotSpawnerCollider: BABYLON.Mesh;
        support: BABYLON.Mesh;
        cog13: BABYLON.Mesh;
        cog8: BABYLON.Mesh;
        axisZMin: number;
        axisZMax: number;
        clicSound: BABYLON.Sound;
        private angleOpened;
        private angleClosed;
        static pivotL: number;
        constructor(machine: Machine, prop: IMachinePartProp);
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(mirrorX: boolean): MachinePartTemplate;
        dispose(): void;
        reset: () => void;
        private _moving;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Speeder extends MachinePart {
        base: BABYLON.Mesh;
        wheel0: BABYLON.Mesh;
        wheel1: BABYLON.Mesh;
        rubber0: BABYLON.Mesh;
        rubber1: BABYLON.Mesh;
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(l: number): MachinePartTemplate;
        private _rotationSpeed;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Spiral extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(l: number, h: number): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class SpiralUTurn extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(l: number, h: number): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Split extends MachinePart {
        private _animatePivot;
        pivot: BABYLON.Mesh;
        axisZMin: number;
        axisZMax: number;
        clicSound: BABYLON.Sound;
        static pivotL: number;
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(mirror: boolean): MachinePartTemplate;
        dispose(): void;
        reset: () => void;
        private _exitLeft;
        private _moving;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Stairway extends MachinePart {
        boxesCount: number;
        boxesColliders: BABYLON.Mesh[];
        boxesDisplayedMesh: BABYLON.Mesh[];
        vil: BABYLON.Mesh;
        bielles: BABYLON.Mesh[];
        x0: number;
        x1: number;
        stepW: number;
        y0: number;
        y1: number;
        stepH: number;
        dH: number;
        static MakeStairwayColliderVertexData(width: number, height: number, depth: number, dH: number, radius?: number): BABYLON.VertexData;
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(l: number, h: number): MachinePartTemplate;
        dispose(): void;
        reset: () => void;
        length: number;
        p: number;
        speed: number;
        a: number;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Start extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class SteamElevator extends MachinePart {
        gearBottom: BABYLON.Mesh;
        gearTop: BABYLON.Mesh;
        largeWheel: BABYLON.Mesh;
        smallWheel: BABYLON.Mesh;
        flyWheel: BABYLON.Mesh;
        engineAxis: BABYLON.Mesh;
        pistonBody: BABYLON.Mesh;
        pistonMove: BABYLON.Mesh;
        pistonBielle: BABYLON.Mesh;
        chain: BABYLON.Mesh;
        courroie: BABYLON.Mesh;
        speed: number;
        x: number;
        rLargeWheel: number;
        rSmallWheel: number;
        rGear: number;
        pGear: number;
        chainLength: number;
        baseChainUVs: number[];
        constructor(machine: Machine, prop: IMachinePartProp);
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(h: number, mirrorX: boolean): MachinePartTemplate;
        dispose(): void;
        reset: () => void;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class TrikeSkull extends MachinePart {
        skull: BABYLON.Mesh;
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class UTurn extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(l: number, h: number, s: number, pipeVersion?: boolean, woodVersion?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class UTurnSharp extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(h: number): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class UTurnV2 extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(h: number, d: number, s: number, mirrorX?: boolean, mirrorZ?: boolean, pipeVersion?: boolean, woodVersion?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Wall extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(l: number, h: number): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Wave extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static PropToPartName(prop: IMachinePartProp): string;
        static GenerateTemplate(l: number, h: number, d: number): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class QuarterNote extends MachinePart {
        static NoteNames: string[];
        static index: number;
        notes: BABYLON.Sound[];
        tings: BABYLON.Mesh[];
        noteMesh: BABYLON.Mesh[];
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(mirrorX: boolean): MachinePartTemplate;
    }
    class DoubleNote extends MachinePart {
        notes: BABYLON.Sound[];
        tings: BABYLON.Mesh[];
        noteMesh: BABYLON.Mesh[];
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(mirrorX: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Art extends BABYLON.Mesh implements IRoomDecor {
        room: Room;
        url: string;
        meshIndex: number;
        h: number;
        getAllMeshes(): BABYLON.Mesh[];
        constructor(room: Room, url: string, meshIndex?: number);
        instantiate(): Promise<void>;
        setLayerMask(mask: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Painting extends BABYLON.Mesh implements IRoomDecor {
        room: Room;
        paintingName: string;
        size: number;
        h: number;
        private _steelFrame;
        private _lightedPlane;
        private _paintBody;
        private _paintPlane;
        getAllMeshes(): BABYLON.Mesh[];
        constructor(room: Room, paintingName: string, size?: number);
        instantiate(): Promise<void>;
        setLayerMask(mask: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class RoomProp {
        name: string;
        hasPaintings: boolean;
        hasSculptures: boolean;
        wallColor: BABYLON.Color3;
        groundColor: BABYLON.Color3;
        isBlurred: boolean;
    }
    interface IRoomDecor extends BABYLON.Mesh {
        h: number;
        setLayerMask(mask: number): void;
        getAllMeshes(): BABYLON.Mesh[];
    }
    class Room {
        machine: Machine;
        game: IGame;
        skybox: BABYLON.Mesh;
        skyboxMaterial: BABYLON.StandardMaterial;
        ground: BABYLON.Mesh;
        wall: BABYLON.Mesh;
        ceiling: BABYLON.Mesh;
        frame: BABYLON.Mesh;
        decors: IRoomDecor[];
        light1: BABYLON.HemisphericLight;
        light2: BABYLON.HemisphericLight;
        private _isBlurred;
        get isBlurred(): boolean;
        set isBlurred(v: boolean);
        constructor(machine: Machine, game: IGame);
        onRoomJustInstantiated: () => void;
        private _currentRoomIndex;
        get currentRoomIndex(): number;
        setRoomIndex(roomIndex: number, forceAndskipAnimation?: boolean): Promise<void>;
        contextualRoomIndex(index: number, q: GraphicQuality): number;
        instantiateSimple(groundColor: BABYLON.Color4, wallColor: BABYLON.Color4, wallPaperIndex: number): Promise<void>;
        instantiateMuseum(useDecors?: boolean, skyboxPath?: string): Promise<void>;
        instantiateOpenRoom(useDecors?: boolean, skyboxPath?: string): Promise<void>;
        animateShow(duration?: number): Promise<void>;
        animateHide(duration?: number): Promise<void>;
        setGroundHeight(h: number): void;
        dispose(): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Sculpt extends BABYLON.Mesh implements IRoomDecor {
        room: Room;
        mat: BABYLON.Material;
        h: number;
        private _steel;
        getAllMeshes(): BABYLON.Mesh[];
        constructor(room: Room, mat: BABYLON.Material);
        instantiate(): Promise<void>;
        setLayerMask(mask: number): void;
    }
}
