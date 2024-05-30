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
        rotationSpeed: number;
        rotationAxis: BABYLON.Vector3;
        surface: Surface;
        _showPositionZeroGhost: boolean;
        get showPositionZeroGhost(): boolean;
        setShowPositionZeroGhost(v: boolean): void;
        positionZeroGhost: BABYLON.Mesh;
        selectedMesh: BABYLON.Mesh;
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
        marbleBowlInsideSound: BABYLON.Sound;
        flybackOrigin: BABYLON.Vector3;
        flybackDestination: BABYLON.Vector3;
        flybackPeak: BABYLON.Vector3;
        flyBackProgress: number;
        flyBackDuration: number;
        animatePosition: (target: BABYLON.Vector3, duration: number) => Promise<void>;
        constructor(positionZero: BABYLON.Vector3, machine: Machine, _materialIndex?: number);
        select(): void;
        unselect(): void;
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
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class MainMaterials {
        game: IGame;
        private _materialsPBR;
        private _materialsSTD;
        getMaterial(colorIndex: number, materialQ?: number): BABYLON.Material;
        get metalMaterialsCount(): number;
        private _ballMaterialsPBR;
        private _ballMaterialsSTD;
        getBallMaterial(colorIndex: number, materialQ?: number): BABYLON.Material;
        get ballMaterialsCount(): number;
        private _wallpapers;
        getWallpaperMaterial(index: number): BABYLON.Material;
        velvetMaterial: BABYLON.StandardMaterial;
        logoMaterial: BABYLON.StandardMaterial;
        baseAxisMaterial: BABYLON.StandardMaterial;
        whiteMaterial: BABYLON.StandardMaterial;
        paintingLight: BABYLON.StandardMaterial;
        wallShadow: BABYLON.StandardMaterial;
        groundMaterial: BABYLON.StandardMaterial;
        handleMaterial: BABYLON.StandardMaterial;
        ghostMaterial: BABYLON.StandardMaterial;
        gridMaterial: BABYLON.StandardMaterial;
        cyanMaterial: BABYLON.StandardMaterial;
        redMaterial: BABYLON.StandardMaterial;
        greenMaterial: BABYLON.StandardMaterial;
        blueMaterial: BABYLON.StandardMaterial;
        whiteAutolitMaterial: BABYLON.StandardMaterial;
        whiteFullLitMaterial: BABYLON.StandardMaterial;
        get plasticBlack(): BABYLON.Material;
        constructor(game: IGame);
        private _makePlasticPBR;
        private _makePlasticSTD;
        private _generateMaterials;
    }
}
declare namespace MarbleRunSimulatorCore {
}
declare namespace MarbleRunSimulatorCore {
    class Tools {
        static V3Dir(angleInDegrees: number, length?: number): BABYLON.Vector3;
        static IsWorldPosAConnexion(worldPos: BABYLON.Vector3): boolean;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Wire extends BABYLON.Mesh {
        track: MachinePart;
        static DEBUG_DISPLAY: boolean;
        static Instances: Nabu.UniqueList<Wire>;
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
        constructor(track: MachinePart);
        show(): void;
        hide(): void;
        recomputeAbsolutePath(): void;
        instantiate(color?: number): Promise<void>;
    }
}
declare namespace MarbleRunSimulatorCore {
    enum GraphicQuality {
        VeryLow = 0,
        Low = 1,
        Medium = 2,
        High = 3
    }
    enum GeometryQuality {
        Low = 0,
        Medium = 1,
        High = 2
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
        room: Room;
        spotLight: BABYLON.SpotLight;
        machine: Machine;
        mode: GameMode;
        shadowGenerator: BABYLON.ShadowGenerator;
        getGraphicQ: () => GraphicQuality;
        getGeometryQ: () => GeometryQuality;
        getMaterialQ: () => MaterialQuality;
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
    enum GameMode {
        Home = 0,
        Page = 1,
        Create = 2,
        Challenge = 3,
        Demo = 4
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
        author?: string;
        v?: number;
        sleepers?: ISleeperMeshProps;
        balls?: IBallData[];
        parts?: IMachinePartData[];
        d?: string;
        r?: number;
    }
    class Machine {
        game: IGame;
        name: string;
        author: string;
        pedestalTop: BABYLON.Mesh;
        baseFrame: BABYLON.Mesh;
        baseLogo: BABYLON.Mesh;
        baseAxis: BABYLON.Mesh;
        parts: MachinePart[];
        balls: Ball[];
        debugAxis: BABYLON.LinesMesh;
        trackFactory: MachinePartFactory;
        templateManager: TemplateManager;
        sleeperVertexData: BABYLON.VertexData[];
        instantiated: boolean;
        minimalAutoQualityFailed: number;
        playing: boolean;
        exitShooter: Shooter;
        exitTrack: Start;
        exitHoleIn: BABYLON.Mesh;
        exitHolePath: BABYLON.Vector3[];
        exitHoleOut: BABYLON.Mesh;
        roomIndex: number;
        constructor(game: IGame);
        setAllIsSelectable(isSelectable: boolean): void;
        instantiate(hotReload?: boolean): Promise<void>;
        dispose(): void;
        getBallPos(): any;
        applyBallPos(save: any): void;
        update(): void;
        play(): void;
        onStopCallbacks: Nabu.UniqueList<() => void>;
        stop(): void;
        margin: number;
        baseMeshMinX: number;
        baseMeshMaxX: number;
        baseMeshMinY: number;
        baseMeshMaxY: number;
        baseMeshMinZ: number;
        baseMeshMaxZ: number;
        generateBaseMesh(): Promise<void>;
        regenerateBaseAxis(): void;
        setBaseIsVisible(v: boolean): void;
        getBankAt(pos: BABYLON.Vector3, exclude: MachinePart): {
            isEnd: boolean;
            bank: number;
            part: MachinePart;
        };
        serialize(): IMachineData;
        serializeV1(): IMachineData;
        serializeV2(): IMachineData;
        serializeV3456(version: number): IMachineData;
        deserialize(data: IMachineData): void;
        deserializeV1(data: IMachineData): void;
        deserializeV2(data: IMachineData): void;
        deserializeV3456(data: IMachineData): void;
        getEncloseStart(): BABYLON.Vector3;
        getEncloseEnd(): BABYLON.Vector3;
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
    var baseRadius: number;
    var tileWidth: number;
    var tileHeight: number;
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
    class MachinePartEndpoint {
        localPosition: BABYLON.Vector3;
        machinePart: MachinePart;
        connectedEndPoint: MachinePartEndpoint;
        i: number;
        j: number;
        k: number;
        constructor(localPosition: BABYLON.Vector3, machinePart: MachinePart);
        get leftSide(): boolean;
        get upperSide(): boolean;
        get farSide(): boolean;
        private _absolutePosition;
        get absolutePosition(): BABYLON.Vector3;
        connectTo(endPoint: MachinePartEndpoint): void;
        disconnect(): void;
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
        selectorMeshDisplay: BABYLON.Mesh;
        selectorMeshLogic: MachinePartSelectorMesh;
        encloseMesh: BABYLON.Mesh;
        isSelectable: boolean;
        summedLength: number[];
        totalLength: number;
        globalSlope: number;
        AABBMin: BABYLON.Vector3;
        AABBMax: BABYLON.Vector3;
        encloseStart: BABYLON.Vector3;
        enclose13: BABYLON.Vector3;
        encloseMid: BABYLON.Vector3;
        enclose23: BABYLON.Vector3;
        encloseEnd: BABYLON.Vector3;
        localCenter: BABYLON.Vector3;
        endPoints: MachinePartEndpoint[];
        neighbours: Nabu.UniqueList<MachinePart>;
        addNeighbour(other: MachinePart): void;
        removeNeighbour(other: MachinePart): void;
        removeAllNeighbours(): void;
        get isRightConnected(): boolean;
        get isUpConnected(): boolean;
        get isDownConnected(): boolean;
        get isBackConnected(): boolean;
        get w(): number;
        get h(): number;
        get d(): number;
        get n(): number;
        get mirrorX(): boolean;
        get mirrorZ(): boolean;
        get xExtendable(): boolean;
        get yExtendable(): boolean;
        get zExtendable(): boolean;
        get nExtendable(): boolean;
        get minW(): number;
        get maxW(): number;
        get minH(): number;
        get maxH(): number;
        get minD(): number;
        get maxD(): number;
        get minN(): number;
        get maxN(): number;
        get xMirrorable(): boolean;
        get zMirrorable(): boolean;
        get hasOriginDestinationHandles(): boolean;
        private _template;
        get template(): MachinePartTemplate;
        setTemplate(template: MachinePartTemplate): void;
        sleepersMeshProp: ISleeperMeshProps;
        constructor(machine: Machine, prop: IMachinePartProp, isPlaced?: boolean);
        offsetPosition: BABYLON.Vector3;
        private _i;
        get i(): number;
        setI(v: number, doNotCheckGridLimits?: boolean): void;
        private _j;
        get j(): number;
        setJ(v: number, doNotCheckGridLimits?: boolean): void;
        private _k;
        get k(): number;
        setK(v: number, doNotCheckGridLimits?: boolean): void;
        setIsVisible(isVisible: boolean): void;
        private _partVisibilityMode;
        get partVisilibityMode(): PartVisibilityMode;
        set partVisibilityMode(v: PartVisibilityMode);
        select(): void;
        unselect(): void;
        getSlopeAt(index: number, trackIndex?: number): number;
        getBankAt(index: number, trackIndex?: number): number;
        getBarycenter(): BABYLON.Vector3;
        recomputeAbsolutePath(): void;
        instantiate(rebuildNeighboursWireMeshes?: boolean): Promise<void>;
        protected instantiateMachineSpecific(): Promise<void>;
        refreshEncloseMeshAndAABB(): void;
        dispose(): void;
        generateWires(): void;
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
        w?: number;
        h?: number;
        d?: number;
        n?: number;
        c?: number[];
        mirrorX?: boolean;
        mirrorZ?: boolean;
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
    interface ISleeperMeshProps {
        spacing?: number;
        drawWallAnchors?: boolean;
        drawGroundAnchors?: boolean;
        groundAnchorsRelativeMaxY?: number;
        forceDrawWallAnchors?: boolean;
        forcedWallAnchorsZ?: number;
    }
    class SleeperMeshBuilder {
        static GenerateSleepersVertexData(part: MachinePart, props: ISleeperMeshProps): Map<number, BABYLON.VertexData>;
    }
}
declare namespace MarbleRunSimulatorCore {
    class TrackTemplate {
        partTemplate: MachinePartTemplate;
        trackpoints: TrackPoint[];
        interpolatedPoints: BABYLON.Vector3[];
        interpolatedNormals: BABYLON.Vector3[];
        angles: number[];
        drawStartTip: boolean;
        drawEndTip: boolean;
        preferedStartBank: number;
        preferedEndBank: number;
        cutOutSleeper: (n: number) => boolean;
        colorIndex: number;
        summedLength: number[];
        totalLength: number;
        globalSlope: number;
        AABBMin: BABYLON.Vector3;
        AABBMax: BABYLON.Vector3;
        constructor(partTemplate: MachinePartTemplate);
        mirrorXTrackPointsInPlace(): void;
        mirrorZTrackPointsInPlace(): void;
        onNormalEvaluated: (n: BABYLON.Vector3, p?: BABYLON.Vector3, relativeIndex?: number) => void;
        initialize(): void;
    }
    class MachinePartTemplate {
        partName: string;
        w: number;
        h: number;
        d: number;
        n: number;
        mirrorX: boolean;
        mirrorZ: boolean;
        angleSmoothSteps: number;
        maxAngle: number;
        minTurnRadius: number;
        xExtendable: boolean;
        yExtendable: boolean;
        zExtendable: boolean;
        nExtendable: boolean;
        minW: number;
        maxW: number;
        minH: number;
        maxH: number;
        minD: number;
        maxD: number;
        minN: number;
        maxN: number;
        xMirrorable: boolean;
        zMirrorable: boolean;
        hasOriginDestinationHandles: boolean;
        trackTemplates: TrackTemplate[];
        endPoints: BABYLON.Vector3[];
        mirrorXTrackPointsInPlace(): void;
        mirrorZTrackPointsInPlace(): void;
        initialize(): void;
    }
    class TemplateManager {
        machine: Machine;
        private _dictionary;
        constructor(machine: Machine);
        getTemplate(partName: string, mirrorX?: boolean, mirrorZ?: boolean): MachinePartTemplate;
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
        recomputeWiresPath(): void;
        recomputeAbsolutePath(): void;
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
        isFirstOrLast(): boolean;
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
    class Elevator extends MachinePart {
        boxesCount: number;
        rWheel: number;
        boxX: number[];
        boxes: BABYLON.Mesh[];
        wheels: BABYLON.Mesh[];
        cable: BABYLON.Mesh;
        constructor(machine: Machine, prop: IMachinePartProp);
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(h: number, mirrorX: boolean): MachinePartTemplate;
        dispose(): void;
        reset: () => void;
        x: number;
        l: number;
        p: number;
        chainLength: number;
        speed: number;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class End extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class FlatJoin extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate;
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
        static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Jumper extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(n: number, mirrorX?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Loop extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(w: number, d: number, n: number, mirrorX: boolean, mirrorZ: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    abstract class MachinePartWithOriginDestination extends MachinePart {
        abstract recreateFromOriginDestination(origin: Nabu.IJK, dest: Nabu.IJK, machine: Machine): MachinePartWithOriginDestination;
        getOrigin(): Nabu.IJK;
        getDestination(): Nabu.IJK;
    }
    class Ramp extends MachinePartWithOriginDestination {
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(w?: number, h?: number, d?: number, mirrorX?: boolean, mirrorZ?: boolean): MachinePartTemplate;
        recreateFromOriginDestination(origin: Nabu.IJK, dest: Nabu.IJK, machine: Machine): Ramp;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Screen extends MachinePart {
        private _animatePivot;
        private _animateLock0;
        private _animateLock2;
        private _animateTingle2Out;
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
        engraine12Up: boolean;
        engraine12Down: boolean;
        tingle2(pixel2Value: boolean, duration: number): Promise<void>;
        rotatePixels(origin: number, target: number, duration: number, easing?: (v: number) => number): Promise<void>;
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate;
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
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(w: number, h: number, mirrorX: boolean): MachinePartTemplate;
        dispose(): void;
        reset: () => void;
        l: number;
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
        animateKickerArm: (target: number, duration: number) => Promise<void>;
        animateKickerKick: (target: number, duration: number) => Promise<void>;
        constructor(machine: Machine, prop: IMachinePartProp);
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(h: number, n: number, mirrorX: boolean): MachinePartTemplate;
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
        static GenerateTemplate(w?: number, mirrorZ?: boolean): MachinePartTemplate;
        recreateFromOriginDestination(origin: Nabu.IJK, dest: Nabu.IJK, machine: Machine): Snake;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Speeder extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Spiral extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(w: number, h: number, mirrorX: boolean, mirrorZ: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Split extends MachinePart {
        private _animatePivot;
        anchor: BABYLON.Mesh;
        pivot: BABYLON.Mesh;
        axisZMin: number;
        axisZMax: number;
        clicSound: BABYLON.Sound;
        static pivotL: number;
        constructor(machine: Machine, prop: IMachinePartProp);
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(mirrorX: boolean, mirrorZ: boolean): MachinePartTemplate;
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
        protected instantiateMachineSpecific(): Promise<void>;
        static GenerateTemplate(w: number, h: number, mirrorX: boolean): MachinePartTemplate;
        dispose(): void;
        reset: () => void;
        l: number;
        p: number;
        speed: number;
        a: number;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Start extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class UTurn extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(h: number, d: number, mirrorX?: boolean, mirrorZ?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class UTurnSharp extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(h: number, mirrorX?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Wall extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(h: number, d: number, mirrorX?: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Wave extends MachinePartWithOriginDestination {
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(w?: number, h?: number, d?: number, mirrorX?: boolean, mirrorZ?: boolean): MachinePartTemplate;
        recreateFromOriginDestination(origin: Nabu.IJK, dest: Nabu.IJK, machine: Machine): Wave;
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
    class Painting extends BABYLON.Mesh implements IRoomDecor {
        room: Room;
        paintingName: string;
        size: number;
        private _steelFrame;
        private _lightedPlane;
        private _paintBody;
        private _paintPlane;
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
        setLayerMask(mask: number): void;
    }
    class Room {
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
        constructor(game: IGame);
        onRoomJustInstantiated: () => void;
        private _currentRoomIndex;
        get currentRoomIndex(): number;
        setRoomIndex(roomIndex: number, forceAndskipAnimation?: boolean): Promise<void>;
        contextualRoomIndex(n: number): number;
        instantiateSimple(groundColor: BABYLON.Color4, wallColor: BABYLON.Color4, wallPaperIndex: number): Promise<void>;
        instantiateMuseum(useDecors?: boolean, skyboxPath?: string): Promise<void>;
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
        constructor(room: Room, mat: BABYLON.Material);
        instantiate(): Promise<void>;
        setLayerMask(mask: number): void;
    }
}
