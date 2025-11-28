namespace MarbleRunSimulatorCore {
    export class EndBasket extends MachinePart {

        public base: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(2);

            this.setTemplate(this.machine.templateManager.getTemplate(EndBasket.PropToPartName(prop)));

            let d = 3.5 * tileSize;
            this.base = new BABYLON.Mesh("base");
            this.base.parent = this;
            let bodyVertexData = BABYLON.CreateCylinderVertexData({ diameter: d, height: 0.005 });
            bodyVertexData.applyToMesh(this.base);

            for (let n = 0; n < 2; n++) {
                let shieldWire = new Wire(this);
                shieldWire.wireSize = 0.004;
                shieldWire.colorIndex = 1;
                shieldWire.path = [];

                for (let i = 0; i < 32; i++) {
                    let a = i / 32 * 2 * Math.PI;
                    let x = Math.cos(a) * 0.5 * d;
                    let z = Math.sin(a) * 0.5 * d;
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

            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "endbasket";
        }
        
        protected async instantiateMachineSpecific(): Promise<void> {
            this.base.material = this.game.materials.getMaterial(this.getColor(0), this.machine.materialQ);
        }

        public onBeforeApplyingSelectorMeshLogicVertexData(selectorMeshLogicVertexDatas: BABYLON.VertexData[]): void {
            let bodySelector = BABYLON.VertexData.ExtractFromMesh(this.base);
            selectorMeshLogicVertexDatas.push(bodySelector);
        }

        public static GenerateTemplate(): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "endbasket";

            template.initialize();

            return template;
        }
    }
}
