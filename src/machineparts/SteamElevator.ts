namespace MarbleRunSimulatorCore {
    export class SteamElevator extends MachinePart {
        
        public gearBottom: BABYLON.Mesh;
        public gearTop: BABYLON.Mesh;
        public largeWheel: BABYLON.Mesh;
        public smallWheel: BABYLON.Mesh;
        public flyWheel: BABYLON.Mesh;
        public engineAxis: BABYLON.Mesh;
        public pistonBody: BABYLON.Mesh;
        public pistonMove: BABYLON.Mesh;
        public pistonBielle: BABYLON.Mesh;
        public chain: BABYLON.Mesh;
        public courroie: BABYLON.Mesh;

        public speed: number = 0.05; // in m/s
        public x: number = 0;
        public rLargeWheel: number = 0.045;
        public rSmallWheel: number = 0.01;
        public rGear: number = 0.022;
        public pGear: number = 1;
        public chainLength: number = 1;
        public baseChainUVs: number[] = [];

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "steamelevator_" + prop.h.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));

            let x = 1;
            if (prop.mirrorX) {
                x = -1;
            }
            
            this.gearTop = new BABYLON.Mesh("gearTop");
            this.gearTop.position.x = tileWidth;
            this.gearTop.position.y = 0;
            this.gearTop.parent = this;

            this.gearBottom = new BABYLON.Mesh("gearBottom");
            this.gearBottom.position.x = tileWidth;
            this.gearBottom.position.y = - tileHeight * this.h;
            this.gearBottom.parent = this;

            this.largeWheel = new BABYLON.Mesh("largeWheel");
            this.largeWheel.position.z = - 0.035;
            this.largeWheel.parent = this.gearBottom;

            this.engineAxis = new BABYLON.Mesh("engineAxis");
            this.engineAxis.position.x = tileWidth;
            this.engineAxis.position.y = - tileHeight * this.h - 0.07;
            this.engineAxis.parent = this;

            this.flyWheel = new BABYLON.Mesh("flyWheel");
            this.flyWheel.position.z = 0.035;
            this.flyWheel.parent = this.engineAxis;

            this.smallWheel = new BABYLON.Mesh("smallWheel");
            this.smallWheel.position.z = - 0.035;
            this.smallWheel.parent = this.engineAxis;

            this.pistonBody = new BABYLON.Mesh("pistonBody");
            this.pistonBody.position.x = tileWidth - 0.04;
            this.pistonBody.position.y = - tileHeight * this.h - 0.07;
            this.pistonBody.parent = this;

            this.pistonMove = new BABYLON.Mesh("pistonMove");
            this.pistonMove.parent = this.pistonBody;

            this.pistonBielle = new BABYLON.Mesh("pistonBielle");
            this.pistonBielle.parent = this.pistonMove;

            this.pGear = 2 * Math.PI * this.rGear;
            this.chainLength = 2 * tileHeight * this.h + this.pGear;
            
            this.chain = new BABYLON.Mesh("chain");
            this.chain.parent = this;
            this.chain.material = this.game.materials.chainMaterial;
            
            this.courroie = new BABYLON.Mesh("courroie");
            this.courroie.position.z = - 0.035;
            this.courroie.scaling.z = 1.25;
            this.courroie.parent = this;

            this.generateWires();

            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            let datas = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/steampunk-elevator.babylon");

            datas[0].applyToMesh(this.gearTop);
            this.gearTop.material = this.game.materials.getMaterial(1, this.machine.materialQ);

            datas[0].applyToMesh(this.gearBottom);
            this.gearBottom.material = this.game.materials.getMaterial(1, this.machine.materialQ);

            datas[1].applyToMesh(this.flyWheel);
            this.flyWheel.material = this.game.materials.getMaterial(1, this.machine.materialQ);

            datas[2].applyToMesh(this.largeWheel);
            this.largeWheel.material = this.game.materials.getMaterial(1, this.machine.materialQ);

            datas[3].applyToMesh(this.smallWheel);
            this.smallWheel.material = this.game.materials.getMaterial(1, this.machine.materialQ);

            datas[4].applyToMesh(this.engineAxis);
            this.engineAxis.material = this.game.materials.getMaterial(1, this.machine.materialQ);

            datas[5].applyToMesh(this.pistonBielle);
            this.pistonBielle.material = this.game.materials.getMaterial(1, this.machine.materialQ);

            datas[6].applyToMesh(this.pistonMove);
            this.pistonMove.material = this.game.materials.getMaterial(1, this.machine.materialQ);

            datas[7].applyToMesh(this.pistonBody);
            this.pistonBody.material = this.game.materials.getMaterial(1, this.machine.materialQ);

            let nCable = 6;

            let rChain = 0.003;
            let x0 = this.gearBottom.position.x;
            let y0 = this.gearBottom.position.y;
            let pathCable: BABYLON.Vector3[] = [];
            for (let i = 0; i <= 12; i++) {
                let a = (i / 12) * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                pathCable.push(new BABYLON.Vector3(x0 + cosa * this.rGear, y0 - sina * this.rGear));
            }
            x0 = this.gearTop.position.x;
            y0 = this.gearTop.position.y;
            for (let i = 0; i < 12; i++) {
                let a = (i / 12) * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                pathCable.push(new BABYLON.Vector3(x0 - cosa * this.rGear, y0 + sina * this.rGear));
            }
            let chainData = Mummu.CreateWireVertexData({ path: pathCable, tesselation: 4, radius: rChain, color: new BABYLON.Color4(1, 1, 1, 1), closed: true, textureRatio: 1.2, bissectFirstRayon: true });
            this.baseChainUVs = [...chainData.uvs];
            for (let i = 0; i < this.baseChainUVs.length / 2; i++) {
                this.baseChainUVs[2 * i + 1] += 0.25;
            }
            chainData.uvs = this.baseChainUVs;
            chainData.applyToMesh(this.chain);
            

            let rCourroie = 0.002;
            x0 = this.engineAxis.position.x;
            y0 = this.engineAxis.position.y;
            pathCable = [];
            for (let i = 0; i <= 16; i++) {
                let a = Math.PI / 10 + (i / 16) * 8 * Math.PI / 10;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                pathCable.push(new BABYLON.Vector3(x0 + cosa * this.rSmallWheel, y0 - sina * this.rSmallWheel));
            }
            x0 = this.gearBottom.position.x;
            y0 = this.gearBottom.position.y;
            for (let i = 0; i <= 16; i++) {
                let a = - Math.PI / 10 + (i / 16) * 12 * Math.PI / 10;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                pathCable.push(new BABYLON.Vector3(x0 - cosa * this.rLargeWheel, y0 + sina * this.rLargeWheel));
            }
            let courroieData = Mummu.CreateWireVertexData({ path: pathCable, tesselation: 4, radius: rCourroie, color: new BABYLON.Color4(1, 1, 1, 1), closed: true, textureRatio: 4, bissectFirstRayon: true });
            courroieData.applyToMesh(this.courroie);

        }

        public static GenerateTemplate(h: number, mirrorX: boolean) {
            let template = new MachinePartTemplate();

            template.partName = "steamelevator_" + h.toFixed(0);
            template.w = 2;
            template.h = h;
            template.mirrorX = mirrorX;

            template.minH = 3;
            template.yExtendable = true;
            template.xMirrorable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let dirLeft = new BABYLON.Vector3(1, 0, 0);
            dirLeft.normalize();
            let nLeft = new BABYLON.Vector3(0, 1, 0);
            nLeft.normalize();

            let dirRight = new BABYLON.Vector3(1, 1, 0);
            dirRight.normalize();
            let nRight = new BABYLON.Vector3(-1, 1, 0);
            nRight.normalize();

            let cupR = 0.008;
            let dH = 0.002;
            let vertX: number = tileWidth * 0.5 + 0.01 - cupR;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * h, 0), dir),

                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX - 1.6 * cupR, -tileHeight * h - dH, 0), dir),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX - 0, -tileHeight * h - dH - cupR * 0.6, 0), dir),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX + cupR, -tileHeight * h - dH, 0), n),

                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX + cupR, - tileHeight, 0), n),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX + cupR - 0.015, 0.035 - tileHeight, 0), new BABYLON.Vector3(-1, 1, 0).normalize(), new BABYLON.Vector3(-1, -1, 0).normalize()),
            ];
            template.trackTemplates[0].drawEndTip = true;

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight, 0), dirLeft),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-0.008 + tileWidth * 0.5, -tileHeight * 0.5, 0), dirRight)
            ];

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }

        public dispose(): void {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }

        public reset = () => {
            this.update(0);
        };

        public update(dt: number): void {
            super.update(dt);
            this.x += this.speed * dt;
            while (this.x > this.chainLength) {
                this.x -= this.chainLength;
            }


            let deltaAngle = - (this.speed * dt / this.pGear) * 2 * Math.PI;
            this.gearBottom.rotation.z += deltaAngle;
            this.gearBottom.rotation.z = Nabu.In0_2PIRange(this.gearBottom.rotation.z);

            
            let newCablesUvs = [...this.baseChainUVs];
            for (let i = 0; i < newCablesUvs.length / 2; i++) {
                newCablesUvs[2 * i + 1] += this.gearTop.rotation.z / (2 * Math.PI) * 12 * 0.5;
            }
            this.chain.setVerticesData(BABYLON.VertexBuffer.UVKind, newCablesUvs);

            this.gearTop.rotation.z += deltaAngle;
            this.gearTop.rotation.z = Nabu.In0_2PIRange(this.gearTop.rotation.z);

            this.engineAxis.rotation.z += (this.rLargeWheel / this.rSmallWheel) * deltaAngle;
            this.engineAxis.rotation.z = Nabu.In0_2PIRange(this.engineAxis.rotation.z);
            
            let xOff = 0.01 * Math.cos(this.engineAxis.rotation.z);
            let yOff = 0.01 * Math.sin(this.engineAxis.rotation.z);
            let pistonBielleLength = 0.04;
            let d = Math.sqrt(pistonBielleLength * pistonBielleLength - yOff * yOff);

            this.pistonMove.position.x = 0.04 - (d - xOff);
            this.pistonBielle.rotation.z = Math.atan(yOff / d);

            this.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
        }
    }
}
