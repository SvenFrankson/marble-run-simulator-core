namespace MarbleRunSimulatorCore {
    export class EndBasket extends MachinePart {

        public base: BABYLON.Mesh;
        public flagPole: BABYLON.Mesh;
        public flag: BABYLON.Mesh;
        public flagKnob: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(1);

            this.setTemplate(this.machine.templateManager.getTemplate(EndBasket.PropToPartName(prop)));

            let d = 3 * tileSize;
            this.base = new BABYLON.Mesh("base");
            this.base.parent = this;
            if (MainMaterials.UseOutlineMeshes) {
                MainMaterials.SetAsOutlinedMesh(this.base);
            }
            let bodyVertexData = Mummu.CreateBeveledCylinderVertexData({ radius: (d - 0.5 * tileSize) * 0.5, height: 0.005 });
            bodyVertexData.applyToMesh(this.base);

            for (let n = 0; n < 2; n++) {
                let shieldWire = new Wire(this);
                shieldWire.wireSize = 0.006;
                shieldWire.colorIndex = 0;
                shieldWire.path = [];

                for (let i = 0; i < 32; i++) {
                    let a = i / 32 * 2 * Math.PI;
                    let x = Math.cos(a) * (1.5 * tileSize - 0.003);
                    let z = Math.sin(a) * (1.5 * tileSize - 0.003);
                    shieldWire.path.push(new BABYLON.Vector3(x, tileHeight * 0.5 * (n + 1), z));
                }
                shieldWire.path.push(shieldWire.path[0].clone());

                this.wires.push(shieldWire);
            }

            let bodyCollider = new Mummu.BoxCollider(this.base._worldMatrix);
            bodyCollider.width = d;
            bodyCollider.height = 0.005;
            bodyCollider.depth = d;
            
            let bodyMachineCollider = new MachineCollider(bodyCollider);
            bodyMachineCollider.bouncyness = 0.2;

            this.colliders = [bodyMachineCollider];

            let flagH = 0.06;
            this.flagPole = new BABYLON.Mesh("flag-pole");
            if (MainMaterials.UseOutlineMeshes) {
                MainMaterials.SetAsOutlinedMesh(this.flagPole);
            }
            let flagPoleVertexData = Mummu.CreateBeveledCylinderVertexData({ radius: 0.001, height: flagH, tessellation: 6 });
            Mummu.TranslateVertexDataInPlace(flagPoleVertexData, new BABYLON.Vector3(0, flagH * 0.5, 0));
            flagPoleVertexData.applyToMesh(this.flagPole);
            this.flagPole.parent = this.base;
            this.flagPole.position.z = - (d - tileSize) * 0.5;
            this.flagPole.position.y = tileHeight;
            this.flagPole.position.z = - d * 0.5;
            Mummu.RotateInPlace(this.flagPole.position, BABYLON.Axis.Y, Math.PI / 8);
            
            this.flag = new BABYLON.Mesh("flag");
            if (MainMaterials.UseOutlineMeshes) {
                MainMaterials.SetAsOutlinedMesh(this.flag);
            }
            let flagVertexData = Mummu.CreateBeveledBoxVertexData({ width: 0.025, height: 0.015, depth: 0.0005 });
            Mummu.TranslateVertexDataInPlace(flagVertexData, new BABYLON.Vector3(0.025 / 2, - 0.015 / 2, 0));
            flagVertexData.applyToMesh(this.flag);
            this.flag.parent = this.flagPole;
            this.flag.position.x = 0.001;
            this.flag.position.y = flagH - 0.001;
            this.flag.position.z = 0.001;

            /*
            this.flagKnob = BABYLON.CreateSphere("flag-knob", { segments: 8, diameter: 0.007 });
            if (MainMaterials.UseOutlineMeshes) {
                MainMaterials.SetAsOutlinedMesh(this.flagKnob);
            }
            this.flagKnob.parent = this.flagPole;
            this.flagKnob.position.y = flagH;
            */

            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "endbasket";
        }
        
        protected async instantiateMachineSpecific(): Promise<void> {
            this.base.material = this.game.materials.getMaterial(this.getColor(0), this.machine.materialQ);
            this.flagPole.material = this.game.materials.getMaterial(18, this.machine.materialQ);
            this.flag.material = this.game.materials.getMaterial(7, this.machine.materialQ);
            //this.flagKnob.material = this.game.materials.getMaterial(this.getColor(0), this.machine.materialQ);
        }

        public onBeforeApplyingSelectorMeshLogicVertexData(selectorMeshLogicVertexDatas: BABYLON.VertexData[]): void {
            let bodySelector = BABYLON.VertexData.ExtractFromMesh(this.base);
            selectorMeshLogicVertexDatas.push(bodySelector);
        }

        public static GenerateTemplate(): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "endbasket";

            template.initialize();

            template.miniatureShapes.push(MiniatureShape.MakeNGon(
                new BABYLON.Vector3(0, - tileHeight * 0.2, 0),
                1.5 * tileSize,
                BABYLON.Axis.Y,
                24,
                true
            ));

            template.miniatureShapes.push(MiniatureShape.MakeNGon(
                new BABYLON.Vector3(0, 0, 0),
                1.5 * tileSize,
                BABYLON.Axis.Y,
                24,
                true
            ));
            
            template.miniatureShapes.push(MiniatureShape.MakeNGon(
                new BABYLON.Vector3(0, tileHeight * 0.5, 0),
                2 * tileSize,
                BABYLON.Axis.Y,
                24,
                false
            ));
            
            template.miniatureShapes.push(MiniatureShape.MakeNGon(
                new BABYLON.Vector3(0, tileHeight, 0),
                2 * tileSize,
                BABYLON.Axis.Y,
                24,
                false
            ));

            return template;
        }
    }
}
