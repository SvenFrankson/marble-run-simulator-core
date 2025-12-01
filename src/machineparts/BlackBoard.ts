namespace MarbleRunSimulatorCore {

    export class BlackBoardPiece extends BABYLON.Mesh {
        constructor(
            public blackboard: BlackBoard,
            public wFactor: number,
            public hFactor: number
        ) {
            super("blackboard-piece");
            let boardVertexData = Mummu.CreateBeveledBoxVertexData({
                width: BlackBoard.BlackBoardW * tileSize * wFactor,
                height: BlackBoard.BlackBoardH * tileHeight * hFactor,
                depth: BlackBoard.BoardThickness
            });
            boardVertexData.applyToMesh(this);
        }
    }

    export class BlackBoard extends MachinePart {
        
        public static BlackBoardW: number = 32;
        public static BlackBoardH: number = 32;
        public static BoardThickness: number = 0.005;
        public rawLines: BABYLON.Vector3[][] = [];
        public boards: BlackBoardPiece[] = [];
        public borders: BABYLON.Mesh[] = [];
        public boardColliders: MachineCollider[] = [];

        private _addBoard(x0: number, x1: number, y0: number, y1: number): void {
            let wFactor = x1 - x0;
            let hFactor = y1 - y0;
            let board = new BlackBoardPiece(this, wFactor, hFactor);
            board.parent = this;
            board.position.x = (BlackBoard.BlackBoardW - 1) * 0.5 * tileSize;
            board.position.x += BlackBoard.BlackBoardW * tileSize * (x0 + x1 - 1) * 0.5;
            board.position.y = (BlackBoard.BlackBoardH - 1) * 0.5 * tileSize;
            board.position.y += BlackBoard.BlackBoardH * tileSize * (y0 + y1 - 1) * 0.5;
            board.position.z = BlackBoard.BoardThickness * 0.5 + 2 * this.wireGauge;

            let boardCollider = new Mummu.BoxCollider(board._worldMatrix);
            boardCollider.width = BlackBoard.BlackBoardW * tileSize * wFactor;
            boardCollider.height = BlackBoard.BlackBoardH * tileHeight * hFactor;
            boardCollider.depth = BlackBoard.BoardThickness;
            
            let boardMachineCollider = new MachineCollider(boardCollider);

            this.boards.push(board);
            this.colliders.push(boardMachineCollider);
            this.boardColliders.push(boardMachineCollider);
        }

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.wireSize = 0.006;

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

            this.colliders = [];
            if (prop.n === 2) {
                // left
                this._addBoard(0, 0.5, 0, 1);
            }
            else if (prop.n === 3) {
                // right
                this._addBoard(0.5, 1, 0, 1);
            }
            else if (prop.n === 4) {
                // top
                this._addBoard(0, 1, 0.5, 1);
            }
            else if (prop.n === 5) {
                // bottom
                this._addBoard(0, 1, 0, 0.5);
            }
            else if (prop.n === 6) {
                // vertical hole
                this._addBoard(0, 1 / 3, 0, 1);
                this._addBoard(2 / 3, 1, 0, 1);
            }
            else if (prop.n === 7) {
                // horizontal hole
                this._addBoard(0, 1, 0, 1 / 3);
                this._addBoard(0, 1, 2 / 3, 1);
            }
            else if (prop.n === 8) {
                // diagonal 2
                this._addBoard(0, 0.5, 0.5, 1);
                this._addBoard(0.5, 1, 0, 0.5);
            }
            else if (prop.n === 9) {
                // diagonal 3
                this._addBoard(0, 1 / 3, 2 / 3, 1);
                this._addBoard(1 / 3, 2 / 3, 1 / 3, 2 / 3);
                this._addBoard(2 / 3, 1, 0, 1 / 3);
            }
            else if (prop.n === 10) {
                // diagonal corners
                this._addBoard(0, 1 / 3, 2 / 3, 1);
                this._addBoard(2 / 3, 1, 0, 1 / 3);
            }
            else if (prop.n === 11) {
                // full corners
                this._addBoard(0, 1 / 3, 2 / 3, 1);
                this._addBoard(2 / 3, 1, 2 / 3, 1);
                this._addBoard(0, 1 / 3, 0, 1 / 3);
                this._addBoard(2 / 3, 1, 0, 1 / 3);
            }
            else {
                // full
                this._addBoard(0, 1, 0, 1);
            }

            let borderThickness = 3 * BlackBoard.BoardThickness;
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
            topMachineCollider.bouncyness = 0.8;
            
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
            rightMachineCollider.bouncyness = 1;
            
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
            bottomMachineCollider.bouncyness = 0.8;
            
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
            leftMachineCollider.bouncyness = 1;

            this.colliders.push(topMachineCollider, rightMachineCollider, bottomMachineCollider, leftMachineCollider);
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "blackboard_" + prop.n;
            return partName;
        }

        public static GenerateTemplate(n: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "blackboard_" + n;
            template.n = n;
            template.nExtendable = true;

            template.initialize();

            return template;
        }
        
        protected async instantiateMachineSpecific(): Promise<void> {
            this.boards.forEach(board => {
                board.material = this.game.materials.getMaterial(this.getColor(1), this.machine.materialQ);
            });

            this.borders.forEach(border => {
                border.material = this.game.materials.getMaterial(this.getColor(2), this.machine.materialQ);
            });
        }

        public onBeforeApplyingSelectorMeshLogicVertexData(selectorMeshLogicVertexDatas: BABYLON.VertexData[]): void {
            this.boards.forEach(boardPiece => {
                let boardSelector = BABYLON.CreateBoxVertexData({
                    width: BlackBoard.BlackBoardW * tileSize * boardPiece.wFactor,
                    height: BlackBoard.BlackBoardH * tileHeight * boardPiece.hFactor,
                    depth: BlackBoard.BoardThickness
                });
                Mummu.TranslateVertexDataInPlace(boardSelector, boardPiece.position);
                selectorMeshLogicVertexDatas.push(boardSelector);
            })
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

                if (trackTemplate.trackpoints.length > 0) {
                    this.template.trackTemplates.push(trackTemplate);
                }
            }

            this.template.initialize();
            this.generateWires();
        }

        public isPointOnBoard(pt: BABYLON.Vector3): boolean {
            for (let i = 0; i < this.boardColliders.length; i++) {
                let board = this.boards[i];
                if (board) {
                    let boardCollider = this.boardColliders[i];
                    if (boardCollider.baseCollider instanceof Mummu.BoxCollider) {
                        let hW = boardCollider.baseCollider.width * 0.5;
                        let hH = boardCollider.baseCollider.height * 0.5;
                        if (pt.x > board.position.x - hW && pt.x < board.position.x + hW) {
                            if (pt.y > board.position.y - hH && pt.y < board.position.y + hH) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }

        public addRawPointLine(points: BABYLON.Vector3[]): void {
            if (points.length > 0) {
                let filteredPoints = [];
                let d = this.wireGauge;
                for (let i = 0; i < points.length; i++) {
                    let pt = points[i];
                    if (this.isPointOnBoard(pt)) {
                        let last = filteredPoints[filteredPoints.length - 1];
                        let sqrDist = Infinity;
                        if (last) {
                            sqrDist = BABYLON.Vector3.DistanceSquared(last, pt);
                        }
                        if (sqrDist > d * d || i === points.length - 1) {
                            filteredPoints.push(pt);
                        }
                    }
                    else if (filteredPoints.length > 0) {
                        break;
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
