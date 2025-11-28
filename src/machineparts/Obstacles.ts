namespace MarbleRunSimulatorCore {
    
    export class Diamond extends MachinePart {

        public body: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(1);

            this.setTemplate(this.machine.templateManager.getTemplate(Diamond.PropToPartName(prop), prop.mirrorX));

            let s = prop.l * tileSize / Math.SQRT2;
            this.body = new BABYLON.Mesh("body");
            this.body.parent = this;
            this.body.rotation.z = Math.PI / 4;
            let bodyVertexData = Mummu.CreateBeveledBoxVertexData({ width: s, height: s, depth: tileSize });
            bodyVertexData.applyToMesh(this.body);

            let bodyCollider = new Mummu.BoxCollider(this.body._worldMatrix);
            bodyCollider.width = s;
            bodyCollider.height = s;
            bodyCollider.depth = tileSize;
            
            let bodyMachineCollider = new MachineCollider(bodyCollider);

            this.colliders = [bodyMachineCollider];

            this.localAABBBaseMin.x = - (prop.l + 0.5) * 0.5 * tileSize;
            this.localAABBBaseMin.y = - (prop.l + 0.5) * 0.5 * tileHeight;
            this.localAABBBaseMax.x = (prop.l + 0.5) * 0.5 * tileSize;
            this.localAABBBaseMax.y = (prop.l + 0.5) * 0.5 * tileHeight;

            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "diamond_" + prop.l.toFixed(0);
            return partName;
        }
        
        protected async instantiateMachineSpecific(): Promise<void> {
            this.body.material = this.game.materials.getMaterial(this.getColor(0), this.machine.materialQ);
        }

        public onBeforeApplyingSelectorMeshLogicVertexData(selectorMeshLogicVertexDatas: BABYLON.VertexData[]): void {
            let bodySelector = BABYLON.VertexData.ExtractFromMesh(this.body);
            Mummu.RotateAngleAxisVertexDataInPlace(bodySelector, Math.PI / 4, BABYLON.Axis.Z);
            selectorMeshLogicVertexDatas.push(bodySelector);
        }

        public static GenerateTemplate(l: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "diamond_" + l.toFixed(0);

            template.l = l;
            template.xExtendable = true;
            template.minL = 1;
            template.maxL = 32;

            template.initialize();

            return template;
        }
    }

    export class Bumper extends MachinePart {

        public body: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(1);

            this.setTemplate(this.machine.templateManager.getTemplate(Bumper.PropToPartName(prop), prop.mirrorX));

            let s = prop.l * tileSize;
            this.body = new BABYLON.Mesh("body");
            this.body.parent = this;
            this.body.rotation.z = Math.PI / 4;
            let bodyVertexData = BABYLON.CreateCylinderVertexData({ diameter: s, height: tileSize });
            Mummu.RotateAngleAxisVertexDataInPlace(bodyVertexData, Math.PI * 0.5, BABYLON.Axis.X);
            bodyVertexData.applyToMesh(this.body);

            let bodyCollider = new Mummu.CapsuleCollider(
                new BABYLON.Vector3(0, 0, - tileSize * 0.5),
                new BABYLON.Vector3(0, 0, tileSize * 0.5),
                s * 0.5,
                this.body._worldMatrix
            );
            
            let bodyMachineCollider = new MachineCollider(bodyCollider);

            this.colliders = [bodyMachineCollider];

            this.localAABBBaseMin.x = - (prop.l + 0.5) * 0.5 * tileSize;
            this.localAABBBaseMin.y = - (prop.l + 0.5) * 0.5 * tileHeight;
            this.localAABBBaseMax.x = (prop.l + 0.5) * 0.5 * tileSize;
            this.localAABBBaseMax.y = (prop.l + 0.5) * 0.5 * tileHeight;

            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "bumper_" + prop.l.toFixed(0);
            return partName;
        }
        
        protected async instantiateMachineSpecific(): Promise<void> {
            this.body.material = this.game.materials.getMaterial(this.getColor(0), this.machine.materialQ);
        }

        public onBeforeApplyingSelectorMeshLogicVertexData(selectorMeshLogicVertexDatas: BABYLON.VertexData[]): void {
            let bodySelector = BABYLON.VertexData.ExtractFromMesh(this.body);
            selectorMeshLogicVertexDatas.push(bodySelector);
        }

        public static GenerateTemplate(l: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "bumper_" + l.toFixed(0);

            template.l = l;
            template.xExtendable = true;
            template.minL = 1;
            template.maxL = 32;

            template.initialize();

            return template;
        }
    }
}
