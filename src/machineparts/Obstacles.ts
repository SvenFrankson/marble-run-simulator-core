namespace MarbleRunSimulatorCore {
    
    export class Diamond extends MachinePart {

        public body: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(1);

            this.setTemplate(this.machine.templateManager.getTemplate(Diamond.PropToPartName(prop), prop.mirrorX));

            let s = prop.l * tileSize / Math.SQRT2;
            this.body = new BABYLON.Mesh("body");
            if (this.machine.toonOutlineRender) {
                MainMaterials.SetAsOutlinedMesh(this.body);
            }
            this.body.parent = this;
            if (prop.l % 2 === 0) {
                this.body.position.x = tileSize * 0.5;
                this.body.position.y = tileHeight * 0.5;
            }
            this.body.rotation.z = Math.PI / 4;
            let bodyVertexData = Mummu.CreateBeveledBoxVertexData({ width: s, height: s, depth: tileSize });
            bodyVertexData.applyToMesh(this.body);

            let bodyCollider = new Mummu.BoxCollider(this.body._worldMatrix);
            bodyCollider.width = s;
            bodyCollider.height = s;
            bodyCollider.depth = tileSize;
            
            let bodyMachineCollider = new MachineCollider(bodyCollider);

            this.colliders = [bodyMachineCollider];

            this.localAABBBaseMin.x = - (prop.l) * 0.5 * tileSize + this.body.position.x;
            this.localAABBBaseMin.y = - (prop.l) * 0.5 * tileHeight + this.body.position.y;
            this.localAABBBaseMax.x = (prop.l) * 0.5 * tileSize + this.body.position.x;
            this.localAABBBaseMax.y = (prop.l) * 0.5 * tileHeight + this.body.position.y;

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

        public recomputeAbsolutePath(): void {
            let collider = this.colliders[0];
            if (collider.baseCollider instanceof Mummu.BoxCollider) {
                collider.baseCollider.worldMatrix = this.body._worldMatrix;
            }
            super.recomputeAbsolutePath();
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

    export class Box extends MachinePart {

        public body: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(1);

            this.setTemplate(this.machine.templateManager.getTemplate(Box.PropToPartName(prop), prop.mirrorX));

            let w = prop.l * tileSize;
            let h = prop.h * tileHeight;
            this.body = new BABYLON.Mesh("body");
            if (this.machine.toonOutlineRender) {
                MainMaterials.SetAsOutlinedMesh(this.body);
            }
            this.body.parent = this;
            if (prop.l % 2 === 0) {
                this.body.position.x = tileSize * 0.5;
            }
            if (prop.h % 2 === 0) {
                this.body.position.y = tileHeight * 0.5;
            }
            let bodyVertexData = Mummu.CreateBeveledBoxVertexData({ width: w, height: h, depth: tileSize });
            bodyVertexData.applyToMesh(this.body);

            let bodyCollider = new Mummu.BoxCollider(this.body._worldMatrix);
            bodyCollider.width = w;
            bodyCollider.height = h;
            bodyCollider.depth = tileSize;
            
            let bodyMachineCollider = new MachineCollider(bodyCollider);

            this.colliders = [bodyMachineCollider];

            this.localAABBBaseMin.x = - (prop.l) * 0.5 * tileSize + this.body.position.x;
            this.localAABBBaseMin.y = - (prop.h) * 0.5 * tileHeight + this.body.position.y;
            this.localAABBBaseMax.x = (prop.l) * 0.5 * tileSize + this.body.position.x;
            this.localAABBBaseMax.y = (prop.h) * 0.5 * tileHeight + this.body.position.y;

            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "box_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
            return partName;
        }
        
        protected async instantiateMachineSpecific(): Promise<void> {
            this.body.material = this.game.materials.getMaterial(this.getColor(0), this.machine.materialQ);
        }

        public onBeforeApplyingSelectorMeshLogicVertexData(selectorMeshLogicVertexDatas: BABYLON.VertexData[]): void {
            let bodySelector = BABYLON.VertexData.ExtractFromMesh(this.body);
            Mummu.TranslateVertexDataInPlace(bodySelector, this.body.position);
            selectorMeshLogicVertexDatas.push(bodySelector);
        }

        public recomputeAbsolutePath(): void {
            let collider = this.colliders[0];
            if (collider.baseCollider instanceof Mummu.BoxCollider) {
                collider.baseCollider.worldMatrix = this.body._worldMatrix;
            }
            super.recomputeAbsolutePath();
        }

        public static GenerateTemplate(l: number, h: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "box_" + l.toFixed(0) + "." + h.toFixed(0);

            template.l = l;
            template.xExtendable = true;
            template.h = h;
            template.yExtendable = true;
            template.minL = 1;
            template.maxL = 32;
            template.minH = 1;
            template.maxH = 32;

            template.initialize();

            let xMin = - l * tileSize * 0.5;
            let xMax = l * tileSize * 0.5;
            let yMin = - h * tileHeight * 0.5;
            let yMax = h * tileHeight * 0.5;
            if (l % 2 === 0) {
                xMin += tileSize * 0.5;
                xMax += tileSize * 0.5;
            }
            if (h % 2 === 0) {
                yMin += tileHeight * 0.5;
                yMax += tileHeight * 0.5;
            }

            let shape = new MiniatureShape();
            shape.points = [
                new BABYLON.Vector3(xMin, yMin, 0),
                new BABYLON.Vector3(xMax, yMin, 0),
                new BABYLON.Vector3(xMax, yMax, 0),
                new BABYLON.Vector3(xMin, yMax, 0),
            ];
            shape.colorSlot = 0;
            shape.updateCenter();
            template.miniatureShapes.push(shape);

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
            if (prop.l % 2 === 0) {
                this.body.position.x = tileSize * 0.5;
                this.body.position.y = tileHeight * 0.5;
            }
            let bodyVertexData = BABYLON.CreateCylinderVertexData({ diameter: s, height: tileSize });
            Mummu.RotateAngleAxisVertexDataInPlace(bodyVertexData, Math.PI * 0.5, BABYLON.Axis.X);
            bodyVertexData.applyToMesh(this.body);

            let bodyCollider = new Mummu.CapsuleCollider(
                new BABYLON.Vector3(0, 0, - tileSize * 0.5),
                new BABYLON.Vector3(0, 0, tileSize * 0.5),
                s * 0.5
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

        public recomputeAbsolutePath(): void {
            super.recomputeAbsolutePath();
            let collider = this.colliders[0];
            if (collider.baseCollider instanceof Mummu.CapsuleCollider) {
                collider.baseCollider.c1.copyFrom(this.position);
                collider.baseCollider.c1.z -= tileSize * 0.5;
                collider.baseCollider.c2.copyFrom(this.position);
                collider.baseCollider.c2.z += tileSize * 0.5;
            }
            super.recomputeAbsolutePath();
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
