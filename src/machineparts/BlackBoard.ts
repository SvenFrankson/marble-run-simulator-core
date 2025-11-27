namespace MarbleRunSimulatorCore {
    export class BlackBoard extends MachinePart {
        
        private static _BoardThickness: number = 0.005;
        public rawLines: BABYLON.Vector3[][] = [];
        public board: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(2);

            this.setTemplate(this.machine.templateManager.getTemplate(BlackBoard.PropToPartName(prop)));

            let rawPoints = [];
            for (let i = 0; i < 10; i++) {
                let x = (i + 0.5 * Math.random()) * tileSize;
                let y = (9 - i * 0.4 + Math.random()) * tileHeight;
                rawPoints.push(new BABYLON.Vector3(x, y, 0));
            }
            //this.addRawPointLine(rawPoints);
            this.regenerateTemplate();

            this.board = new BABYLON.Mesh("board");
            let boardVertexData = Mummu.CreateBeveledBoxVertexData({
                width: 20 * tileSize,
                height: 20 * tileHeight,
                depth: BlackBoard._BoardThickness
            });
            Mummu.TranslateVertexDataInPlace(boardVertexData, new BABYLON.Vector3(9.5 * tileSize, 9.5 * tileHeight, 0));
            boardVertexData.applyToMesh(this.board);
            this.board.parent = this;
            this.board.position.z = BlackBoard._BoardThickness * 0.5 + this.wireGauge;
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "blackboard";
            return partName;
        }

        public static GenerateTemplate(): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "blackboard";

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            template.trackTemplates[0] = new TrackTemplate(template);

            let start = new BABYLON.Vector3(- tileSize * 0.5, 0, 0);
            let end = new BABYLON.Vector3(tileSize * 0.5, 0, 0);

            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], start, dir, undefined, undefined, 1)];
            template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], end, dir, undefined, 1));

            template.initialize();

            return template;
        }
        
        protected async instantiateMachineSpecific(): Promise<void> {
            this.board.material = this.game.materials.getMaterial(this.getColor(1), this.machine.materialQ);
        }

        public onBeforeApplyingSelectorMeshLogicVertexData(selectorMeshLogicVertexDatas: BABYLON.VertexData[]): void {
            let boardSelector = BABYLON.CreateBoxVertexData({
                width: 20 * tileSize,
                height: 20 * tileHeight,
                depth: BlackBoard._BoardThickness
            });
            Mummu.TranslateVertexDataInPlace(boardSelector, new BABYLON.Vector3(9.5 * tileSize, 9.5 * tileHeight, 0));
            selectorMeshLogicVertexDatas.push(boardSelector);
        }

        public regenerateTemplate(): void {
            this.template.trackTemplates = [];

            for (let n = 0; n < this.rawLines.length; n++) {
                let rawLine = this.rawLines[n];
                let trackTemplate = new TrackTemplate(this.template);
                let dirStart = rawLine[1].subtract(rawLine[0]).normalize();
                let prevDir = dirStart.clone();
                let normStart = Mummu.Rotate(dirStart, BABYLON.Axis.Z, Math.PI * 0.5);
                if (normStart.y < 0) {
                    normStart.scaleInPlace(-1);
                }
                let prevNorm = normStart.clone();
                let avgNorm = BABYLON.Vector3.Zero();

                for (let i = 0; i < rawLine.length; i++) {
                    let rawPoint = rawLine[i];
                    let prev = rawLine[i - 1];
                    let next = rawLine[i + 1];
                    if (!prev) {
                        prev = rawLine[i];
                    }
                    if (!next) {
                        next = rawLine[i];
                    }
                    let dir = next.subtract(prev).normalize();

                    let angle = Mummu.AngleFromToAround(prevDir, dir, BABYLON.Axis.Z);
                    let norm = Mummu.Rotate(prevNorm, BABYLON.Axis.Z, angle);
                    avgNorm.addInPlace(norm);

                    //Mummu.DrawDebugLine(rawPoint.add(this.position), rawPoint.add(this.position).add(norm.scale(0.8)), 300, BABYLON.Color3.Red());

                    trackTemplate.trackpoints.push(new TrackPoint(trackTemplate, rawPoint, dir, norm));

                    prevDir.copyFrom(dir);
                    prevNorm.copyFrom(norm);
                }

                if (avgNorm.y < 0) {
                    trackTemplate.trackpoints.forEach(trackpoint => {
                        trackpoint.normal.scaleInPlace(-1);
                    })
                }
                this.template.trackTemplates.push(trackTemplate);
            }

            this.template.initialize();
            this.generateWires();
        }

        public addRawPointLine(points: BABYLON.Vector3[]): void {
            if (points.length > 0) {
                let filteredPoints = [points[0]];
                let d = this.wireGauge;
                for (let i = 1; i < points.length; i++) {
                    let pt = points[i];
                    let last = filteredPoints[filteredPoints.length - 1];
                    let sqrDist = BABYLON.Vector3.DistanceSquared(last, pt);
                    if (sqrDist > d * d) {
                        filteredPoints.push(pt);
                    }
                }

                Mummu.SmoothPathInPlace(filteredPoints, 0.5);

                this.rawLines.push(filteredPoints);
            }
        }
    }
}
