/// <reference path="MachineDecor.ts"/>

namespace MarbleRunSimulatorCore {
    export class Xylophone extends MachineDecor {

        public static NotesName = [
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

        public sound: BABYLON.Sound;

        public trigger: BABYLON.Mesh;
        public blade: BABYLON.Mesh;

        private _animateTrigger = Mummu.AnimationFactory.EmptyNumberCallback;

        constructor(machine: Machine) {
            super(machine, "xylophone");
            this._n = 12;

            this.trigger = new BABYLON.Mesh("trigger");
            this.trigger.position.y = 0.02;
            this.trigger.parent = this;

            this.blade = new BABYLON.Mesh("blade");
            this.blade.parent = this;

            this._animateTrigger = Mummu.AnimationFactory.CreateNumber(
                this,
                this.trigger.rotation,
                "x",
                () => {
                    if (!this.machine.playing) {
                        this.trigger.rotation.x = 0;
                    }
                    this.trigger.freezeWorldMatrix();
                    this.trigger.getChildMeshes().forEach((child) => {
                        child.freezeWorldMatrix();
                    });
                },
                false,
                Nabu.Easing.easeInSquare
            );
        }

        public instantiateSelectorMesh(): void {
            this.selectorMesh = new MachineDecorSelector(this, "xylophone-selector");
            let dataDisplay = BABYLON.CreateBoxVertexData({ size: 0.022 });
            Mummu.ColorizeVertexDataInPlace(dataDisplay, BABYLON.Color3.FromHexString("#00FFFF"));
            dataDisplay.applyToMesh(this.selectorMesh)
            this.selectorMesh.material = this.machine.game.materials.whiteFullLitMaterial;
        }

        protected async instantiateMachineDecorSpecific(): Promise<void> {
            let data = await this.machine.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/xylophone.babylon");
            data[0].applyToMesh(this);
            this.material = this.machine.game.materials.getMaterial(0);
            data[1].applyToMesh(this.trigger);
            this.trigger.material = this.machine.game.materials.plasticBlack;
            data[2].applyToMesh(this.blade);
            this.blade.material = this.machine.game.materials.getMaterial(1);

            this.sound = new BABYLON.Sound("marble-bowl-inside-sound", "./work/xylophone/A (" + (this.n + 1).toFixed(0) + ").wav", this.getScene(), undefined, { loop: false, autoplay: false });
            this.sound.setVolume(1);
        }

        public onNSet(n: number): void {
            if (n > 0) {
                this.sound = new BABYLON.Sound("marble-bowl-inside-sound", "./work/xylophone/A (" + (n + 1).toFixed(0) + ").wav", this.getScene(), undefined, { loop: false, autoplay: false });
            }
        }

        public sounding: boolean = false;
        public async onBallCollideAABB(ball: Ball): Promise<void> {
            if (this.sounding) {
                return;
            }
            if (BABYLON.Vector3.DistanceSquared(ball.position, this.position) < 0.01 * 0.01) {
                this.sounding = true;
                await this._animateTrigger(-75 / 180 * Math.PI, 0.05);
                this.sound.play();
                if (this.onSoundPlay) {
                    this.onSoundPlay();
                }
                await this._animateTrigger(0, 0.2);
                this.sounding = false;
            }
        }

        public onSoundPlay: () => void;
    }
}