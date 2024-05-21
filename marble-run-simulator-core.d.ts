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
        Bowl = 1
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
        constructor(positionZero: BABYLON.Vector3, machine: Machine, _materialIndex?: number);
        select(): void;
        unselect(): void;
        setIsVisible(isVisible: boolean): void;
        instantiate(): Promise<void>;
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
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class MainMaterials {
        game: IGame;
        private _metalMaterialsPBR;
        private _metalMaterialsSTD;
        getMetalMaterial(colorIndex: number, graphicQ?: number): BABYLON.Material;
        get metalMaterialsCount(): number;
        private _ballMaterialsPBR;
        private _ballMaterialsSTD;
        getBallMaterial(colorIndex: number, graphicQ?: number): BABYLON.Material;
        get ballMaterialsCount(): number;
        velvetMaterial: BABYLON.StandardMaterial;
        logoMaterial: BABYLON.StandardMaterial;
        baseAxisMaterial: BABYLON.StandardMaterial;
        leatherMaterial: BABYLON.StandardMaterial;
        whiteMaterial: BABYLON.StandardMaterial;
        paintingLight: BABYLON.StandardMaterial;
        handleMaterial: BABYLON.StandardMaterial;
        ghostMaterial: BABYLON.StandardMaterial;
        gridMaterial: BABYLON.StandardMaterial;
        cyanMaterial: BABYLON.StandardMaterial;
        redMaterial: BABYLON.StandardMaterial;
        greenMaterial: BABYLON.StandardMaterial;
        blueMaterial: BABYLON.StandardMaterial;
        whiteAutolitMaterial: BABYLON.StandardMaterial;
        whiteFullLitMaterial: BABYLON.StandardMaterial;
        constructor(game: IGame);
    }
}
declare namespace MarbleRunSimulatorCore {
}
declare namespace MarbleRunSimulatorCore {
    class Tools {
        static V3Dir(angleInDegrees: number, length?: number): BABYLON.Vector3;
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
    }
    class Machine {
        game: IGame;
        name: string;
        author: string;
        baseWall: BABYLON.Mesh;
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
        playing: boolean;
        constructor(game: IGame);
        setAllIsSelectable(isSelectable: boolean): void;
        instantiate(): Promise<void>;
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
        serializeV345(version: number): IMachineData;
        deserialize(data: IMachineData): void;
        deserializeV1(data: IMachineData): void;
        deserializeV2(data: IMachineData): void;
        deserializeV345(data: IMachineData): void;
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
        selectorMesh: MachinePartSelectorMesh;
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
        neighbours: Nabu.UniqueList<MachinePart>;
        addNeighbour(other: MachinePart): void;
        removeNeighbour(other: MachinePart): void;
        removeAllNeighbours(): void;
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
        get minH(): number;
        get minD(): number;
        get maxD(): number;
        get xMirrorable(): boolean;
        get zMirrorable(): boolean;
        get hasOriginDestinationHandles(): boolean;
        private _template;
        get template(): MachinePartTemplate;
        setTemplate(template: MachinePartTemplate): void;
        sleepersMeshProp: ISleeperMeshProps;
        constructor(machine: Machine, prop: IMachinePartProp, isPlaced?: boolean);
        private _i;
        get i(): number;
        setI(v: number): void;
        private _j;
        get j(): number;
        setJ(v: number): void;
        private _k;
        get k(): number;
        setK(v: number): void;
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
        minH: number;
        minD: number;
        maxD: number;
        xMirrorable: boolean;
        zMirrorable: boolean;
        hasOriginDestinationHandles: boolean;
        trackTemplates: TrackTemplate[];
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
        clicSound: BABYLON.Sound;
        static pivotL: number;
        constructor(machine: Machine, prop: IMachinePartProp);
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
        constructor(machine: Machine, prop: IMachinePartProp);
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
    class Screw extends MachinePart {
        box: BABYLON.Mesh;
        screwWire: Wire;
        x0: number;
        x1: number;
        stepW: number;
        y0: number;
        y1: number;
        stepH: number;
        dH: number;
        dir: BABYLON.Vector3;
        constructor(machine: Machine, prop: IMachinePartProp);
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
        static GenerateTemplate(h: number, mirrorX: boolean): MachinePartTemplate;
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
    class Spiral extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(w: number, h: number, mirrorX: boolean, mirrorZ: boolean): MachinePartTemplate;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Split extends MachinePart {
        private _animatePivot;
        pivot: BABYLON.Mesh;
        clicSound: BABYLON.Sound;
        static pivotL: number;
        constructor(machine: Machine, prop: IMachinePartProp);
        static GenerateTemplate(mirrorX: boolean): MachinePartTemplate;
        dispose(): void;
        reset: () => void;
        private _moving;
        update(dt: number): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Stairway extends MachinePart {
        boxesCount: number;
        boxes: BABYLON.Mesh[];
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
        static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate;
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
    class Painting extends BABYLON.Mesh {
        room: Room;
        paintingName: string;
        size: number;
        constructor(room: Room, paintingName: string, size?: number);
        instantiate(): Promise<void>;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Room {
        game: IGame;
        ground: BABYLON.Mesh;
        wall: BABYLON.Mesh;
        frame: BABYLON.Mesh;
        light1: BABYLON.HemisphericLight;
        light2: BABYLON.HemisphericLight;
        constructor(game: IGame);
        instantiate(): Promise<void>;
        setGroundHeight(h: number): void;
        dispose(): void;
    }
}
declare namespace MarbleRunSimulatorCore {
    class Sculpt extends BABYLON.Mesh {
        room: Room;
        mat: BABYLON.Material;
        constructor(room: Room, mat: BABYLON.Material);
        instantiate(): Promise<void>;
    }
}
