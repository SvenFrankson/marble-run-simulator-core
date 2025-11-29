namespace MarbleRunSimulatorCore {
    export class BlackBoard extends MachinePart {
        
        public static BlackBoardW: number = 32;
        public static BlackBoardH: number = 32;
        private static _BoardThickness: number = 0.005;
        public rawLines: BABYLON.Vector3[][] = [];
        public board: BABYLON.Mesh;
        public borders: BABYLON.Mesh[] = [];

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(3);

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
            this.board.parent = this;
            this.board.position.x = (BlackBoard.BlackBoardW - 1) * 0.5 * tileSize;
            this.board.position.y = (BlackBoard.BlackBoardH - 1) * 0.5 * tileSize;
            this.board.position.z = BlackBoard._BoardThickness * 0.5 + 2 * this.wireGauge;
            let boardVertexData = Mummu.CreateBeveledBoxVertexData({
                width: BlackBoard.BlackBoardW * tileSize,
                height: BlackBoard.BlackBoardH * tileHeight,
                depth: BlackBoard._BoardThickness
            });
            boardVertexData.applyToMesh(this.board);

            let boardCollider = new Mummu.BoxCollider(this.board._worldMatrix);
            boardCollider.width = BlackBoard.BlackBoardW * tileSize;
            boardCollider.height = BlackBoard.BlackBoardH * tileHeight;
            boardCollider.depth = BlackBoard._BoardThickness;
            
            let boardMachineCollider = new MachineCollider(boardCollider);

            let borderThickness = 3 * BlackBoard._BoardThickness;
            let borderDepth = 3 * tileSize;

            this.borders[0] = new BABYLON.Mesh("top-border");
            this.borders[0].parent = this;
            this.borders[0].position.x = (BlackBoard.BlackBoardW - 1) * 0.5 * tileSize;
            this.borders[0].position.y = (BlackBoard.BlackBoardH - 0.5) * tileSize + 0.5 * borderThickness;
            //this.borders[0].position.z = BlackBoard._BoardThickness * 0.5 + 2 * this.wireGauge;
            let topVertexData = Mummu.CreateBeveledBoxVertexData({
                width: BlackBoard.BlackBoardW * tileSize + 2 * borderThickness,
                height: borderThickness,
                depth: borderDepth
            });
            topVertexData.applyToMesh(this.borders[0]);
            
            let topCollider = new Mummu.BoxCollider(this.borders[0]._worldMatrix);
            topCollider.width = BlackBoard.BlackBoardW * tileSize;
            topCollider.height = borderThickness;
            topCollider.depth = borderDepth;
            
            let topMachineCollider = new MachineCollider(topCollider);
            
            this.borders[1] = new BABYLON.Mesh("right-border");
            this.borders[1].parent = this;
            this.borders[1].position.x = (BlackBoard.BlackBoardW - 0.5) * tileSize + 0.5 * borderThickness;
            this.borders[1].position.y = (BlackBoard.BlackBoardH - 1) * 0.5 * tileSize;
            //this.borders[1].position.z = BlackBoard._BoardThickness * 0.5 + 2 * this.wireGauge;
            let rightVertexData = Mummu.CreateBeveledBoxVertexData({
                width: borderThickness,
                height: BlackBoard.BlackBoardH * tileSize,
                depth: borderDepth
            });
            rightVertexData.applyToMesh(this.borders[1]);
            
            let rightCollider = new Mummu.BoxCollider(this.borders[1]._worldMatrix);
            rightCollider.width = borderThickness;
            rightCollider.height = BlackBoard.BlackBoardH * tileSize;
            rightCollider.depth = borderDepth;
            
            let rightMachineCollider = new MachineCollider(rightCollider);
            
            this.borders[2] = new BABYLON.Mesh("bottom-border");
            this.borders[2].parent = this;
            this.borders[2].position.x = (BlackBoard.BlackBoardW - 1) * 0.5 * tileSize;
            this.borders[2].position.y = - 0.5 * tileSize - 0.5 * borderThickness;
            //this.borders[2].position.z = BlackBoard._BoardThickness * 0.5 + 2 * this.wireGauge;
            let bottomVertexData = Mummu.CreateBeveledBoxVertexData({
                width: BlackBoard.BlackBoardW * tileSize + 2 * borderThickness,
                height: borderThickness,
                depth: borderDepth
            });
            bottomVertexData.applyToMesh(this.borders[2]);
            
            let bottomCollider = new Mummu.BoxCollider(this.borders[2]._worldMatrix);
            bottomCollider.width = BlackBoard.BlackBoardW * tileSize;
            bottomCollider.height = borderThickness;
            bottomCollider.depth = borderDepth;
            
            let bottomMachineCollider = new MachineCollider(bottomCollider);
            
            this.borders[3] = new BABYLON.Mesh("left-border");
            this.borders[3].parent = this;
            this.borders[3].position.x = - 0.5 * tileSize - 0.5 * borderThickness;
            this.borders[3].position.y = (BlackBoard.BlackBoardH - 1) * 0.5 * tileSize;
            //this.borders[3].position.z = BlackBoard._BoardThickness * 0.5 + 2 * this.wireGauge;
            let leftVertexData = Mummu.CreateBeveledBoxVertexData({
                width: borderThickness,
                height: BlackBoard.BlackBoardH * tileSize,
                depth: borderDepth
            });
            leftVertexData.applyToMesh(this.borders[3]);
            
            let leftCollider = new Mummu.BoxCollider(this.borders[3]._worldMatrix);
            leftCollider.width = borderThickness;
            leftCollider.height = BlackBoard.BlackBoardH * tileSize;
            leftCollider.depth = borderDepth;
            
            let leftMachineCollider = new MachineCollider(leftCollider);

            this.colliders = [boardMachineCollider, topMachineCollider, rightMachineCollider, bottomMachineCollider, leftMachineCollider];
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
            this.borders.forEach(border => {
                border.material = this.game.materials.getMaterial(this.getColor(2), this.machine.materialQ);
            })
        }

        public onBeforeApplyingSelectorMeshLogicVertexData(selectorMeshLogicVertexDatas: BABYLON.VertexData[]): void {
            let boardSelector = BABYLON.CreateBoxVertexData({
                width: BlackBoard.BlackBoardW * tileSize,
                height: BlackBoard.BlackBoardH * tileHeight,
                depth: BlackBoard._BoardThickness
            });
            Mummu.TranslateVertexDataInPlace(boardSelector, this.board.position);
            selectorMeshLogicVertexDatas.push(boardSelector);
        }

        public regenerateTemplate(): void {
            this.template.trackTemplates = [];

            for (let n = 0; n < this.rawLines.length; n++) {
                let rawLine = this.rawLines[n];
                let trackTemplate = new TrackTemplate(this.template);
                trackTemplate.isDouble = true;
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
                let filteredPoints = [];
                let d = this.wireGauge;
                for (let i = 0; i < points.length; i++) {
                    let pt = points[i];
                    if (pt.x > this.worldAABBMin.x && pt.x < this.worldAABBMax.x) {
                        if (pt.y > this.worldAABBMin.y && pt.y < this.worldAABBMax.y) {
                            let last = filteredPoints[filteredPoints.length - 1];
                            let sqrDist = Infinity;
                            if (last) {
                                sqrDist = BABYLON.Vector3.DistanceSquared(last, pt);
                            }
                            if (sqrDist > d * d) {
                                filteredPoints.push(pt);
                            }
                        }
                    }
                }

                Mummu.SmoothPathInPlace(filteredPoints, 0.5);
                Mummu.SmoothPathInPlace(filteredPoints, 0.5);
                Mummu.SmoothPathInPlace(filteredPoints, 0.5);

                this.rawLines.push(filteredPoints);
            }
        }

        public setI(v: number, doNotCheckGridLimits?: boolean): void {
            super.setI(0, true);
        }

        public setJ(v: number, doNotCheckGridLimits?: boolean): void {
            super.setJ(0, true);
        }

        public setK(v: number, doNotCheckGridLimits?: boolean): void {
            super.setK(1, true);
        }

        public setR(v: number, doNotCheckGridLimits?: boolean): void {
            super.setR(0, true);
        }

        public setTargetI(v: number, doNotCheckGridLimits?: boolean): void {
            super.setTargetI(0, true);
        }

        public setTargetJ(v: number, doNotCheckGridLimits?: boolean): void {
            super.setTargetJ(0, true);
        }

        public setTargetK(v: number, doNotCheckGridLimits?: boolean): void {
            super.setTargetK(1, true);
        }

        public setTargetR(v: number): void {
            super.setTargetR(0);
        }
        
        public getProjection(worldPosition: BABYLON.Vector3, outProj: BABYLON.Vector3, outDir: BABYLON.Vector3, outUp: BABYLON.Vector3): void {
            let invWorldMatrix = this.getWorldMatrix().clone().invert();
            let localPosition = BABYLON.Vector3.TransformCoordinates(worldPosition, invWorldMatrix);
            localPosition.z = 0;
            BABYLON.Vector3.TransformCoordinatesToRef(localPosition, this.getWorldMatrix(), outProj);
            outDir.copyFromFloats(1, 0, 0);
            outUp.copyFromFloats(0, 1, 0);
        }
    }
}
