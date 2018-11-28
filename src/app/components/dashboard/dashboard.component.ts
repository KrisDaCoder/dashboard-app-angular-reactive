import { DataService } from './../../services/data.service';
import { DashboardService } from './../../services/dashboard.service';
import { DeleteChartComponent } from './../delete-chart/delete-chart.component';
import { CommunicationService } from './../../services/communication.service';
import { Component, OnInit } from '@angular/core';
import { GridsterConfig } from 'angular-gridster2';
import { Chart } from 'chart.js';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { EditLineChartComponent } from '../edit-line-chart/edit-line-chart.component';
import { EditBarChartComponent } from './../edit-bar-chart/edit-bar-chart.component';
import { CreateBarChartComponent } from './../create-bar-chart/create-bar-chart.component';
import { CreateLineChartComponent } from './../create-line-chart/create-line-chart.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  
  activeDashboard: any;
  charts: any[];
  options: GridsterConfig;
  // showButtons: boolean[];
  showGrid: boolean = true;
  data: any;
  dataSSE: any;
  chartObjects: Chart[];

  constructor(
    private communicationService: CommunicationService,
    private dialog: MatDialog,
    private dashboardService: DashboardService,
    private dataService: DataService
    ) { }

  ngOnInit() {
    this.communicationService.selectedDashboard.subscribe(value => {

      if(!(typeof value === 'undefined')) {
        this.dashboardService.getDashboard(value).subscribe(dashboard => {
          this.activeDashboard = dashboard;
          // this.charts = this.activeDashboard.charts;    
          this.showGrid = false;
          // this.showButtons = this.createBooleanArray(this.charts.length);
          this.dataService.getData().subscribe(result => {
            this.data = result[0];
            this.dataService.getDataSSE().subscribe(result => {
              this.dataSSE = result;
              this.data = result;
              this.updateData();
            });
          });
        });
      }
    });

    this.options = {
      swap: true,
      enableEmptyCellDrop: true,
      emptyCellDropCallback: (event, item) => this.onDrop(event, item),
      pushItems: true,
      pushDirections: { north: true, east: true, south: true, west: true },
      draggable: { enabled: true },
      resizable: {
        enabled: true,
        handles: {s: false, e: false, n: false, w: false, se: true, ne:false, sw: false, nw: false}
        // handles: {s: true, e: true, n: true, w: true, se: true, ne:true, sw: true, nw: true}

      },
      gridType: 'fixed',
      fixedColWidth: 50,
      fixedRowHeight: 50,
      maxCols: 32,
      maxRows:20,
      itemChangeCallback: (item, itemComponent) => this.itemChange(item, itemComponent),
      itemInitCallback: (item, itemComponent) => this.createCharts()
    };

  }

  itemChange(item, itemComponent) {

    this.dashboardService.updateDashboard(this.activeDashboard).subscribe(res => {});

  }

  createCharts() {

    this.chartObjects = [];

    let options;
    this.activeDashboard.charts.forEach(res => {

      if(res.type === 'pie') {
        options = {
          title: {
            display: true,
            text: res.title,
            fontSize: 18
          }
        };
      } else {
        options = {
          scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
          },
          title: {
            display: true,
            text: res.title,
            fontSize: 18
          }
        }
      }

      let newchart = new Chart(res.htmlId, {
        type: res.type,
        data: {
            labels: this.data.labels,
            datasets: [
            {
                label: res.label,
                backgroundColor: res.backgroundColor,
                borderColor: res.borderColor,
                data: this.data.values,
                borderWidth: 3
            }
            ]
        },
        options: options
      });
      
      this.chartObjects.push(newchart);
      
    });

  }

  updateData() {
    if(this.chartObjects) {
      this.chartObjects.forEach(chart => {
        chart.data.labels = this.dataSSE.labels;
        chart.data.datasets[0].data = this.dataSSE.values;
        chart.update();
      });
    }
  }

  // createBooleanArray(size: number): boolean[] {
  //   let arr: boolean[] = [];
  //   for(let i=0; i < size; i++) {
  //     arr.push(false);
  //   }

  //   return arr;
  // }

  // hoverOverGridsterItem(i) {
  //   this.showButtons[i] = true;
  // }

  // leaveGridsteritem(i) {
  //   this.showButtons[i] = false;    
  // }

  deleteChart(i) {

    const config = new MatDialogConfig();
    config.disableClose = true;
    config.autoFocus = true;

    const dialogRef = this.dialog.open(DeleteChartComponent, config);

    dialogRef.afterClosed().subscribe(result => {

      if(result === 1) {
        
        this.activeDashboard.charts.splice(i, 1);
        this.dashboardService.updateDashboard(this.activeDashboard).subscribe(res => {});
        
      }

    });

  }

  editChart(chart: any, index: number) {
    const config = new MatDialogConfig();
    config.disableClose = true;
    config.autoFocus = true;
    config.data = chart;
    
    let dialogRef;
    let newChart;
    switch (chart.type) {
      case 'line':
        dialogRef = this.dialog.open(EditLineChartComponent, config);
        dialogRef.afterClosed().subscribe(result => {
          if(result !== 0) {
            this.activeDashboard.charts[index].backgroundColor = [result.chartBackgroundColor];
            this.activeDashboard.charts[index].borderColor = [result.chartBorderColor];
            this.activeDashboard.charts[index].label = result.chartLabel;
            this.activeDashboard.charts[index].title = result.chartTitle;
            newChart = this.activeDashboard.charts[index]
            this.activeDashboard.charts.splice(index, 1);
            this.activeDashboard.charts.push(newChart);
            this.createChartFromEdit(newChart);
            this.dashboardService.updateDashboard(this.activeDashboard).subscribe(res => {
              this.activeDashboard = res;
            });
          }
        })
        break;

      case 'bar':
        dialogRef = this.dialog.open(EditBarChartComponent, config);
        dialogRef.afterClosed().subscribe(result => {
          if(result !== 0) {
            this.activeDashboard.charts[index].backgroundColor = result.backgroundColors;
            this.activeDashboard.charts[index].borderColor = result.borderColors;
            this.activeDashboard.charts[index].label = result.chartLabel;
            this.activeDashboard.charts[index].title = result.chartTitle;
            newChart = this.activeDashboard.charts[index];
            this.activeDashboard.charts.splice(index, 1);
            this.activeDashboard.charts.push(newChart);
            this.createChartFromEdit(newChart);
            this.dashboardService.updateDashboard(this.activeDashboard).subscribe(res => {
              this.activeDashboard = res;
             });
          }
        })
        break;

      case 'pie':
        dialogRef = this.dialog.open(EditBarChartComponent, config);
        dialogRef.afterClosed().subscribe(result => {
          if(result !== 0) {
            this.activeDashboard.charts[index].backgroundColor = result.backgroundColors;
            this.activeDashboard.charts[index].borderColor = result.borderColors;
            this.activeDashboard.charts[index].label = result.chartLabel;
            this.activeDashboard.charts[index].title = result.chartTitle;
            newChart = this.activeDashboard.charts[index];
            this.activeDashboard.charts.splice(index, 1);
            this.chartObjects.splice(index, 1);
            this.activeDashboard.charts.push(newChart);
            this.chartObjects.push(this.createChartFromEdit(newChart));
            this.dashboardService.updateDashboard(this.activeDashboard).subscribe(res => {
              this.activeDashboard = res;
             });
          }
        });
        break;
    
      default:
        console.log('No dialog was config for this type of chart at the moment');
        break;
    }
    
  }

  createChartFromEdit(chart: any): Chart {

    let options;
    if(chart.type === 'pie') {
      options = {
        title: {
          display: true,
          text: chart.title,
          fontSize: 18
        }
      };
    } else {
      options = {
        scales: {
          yAxes: [{
              ticks: {
                  beginAtZero:true
              }
          }]
        },
        title: {
          display: true,
          text: chart.title,
          fontSize: 18
        }
      }
    }

    return new Chart(chart.htmlId, {
      type: chart.type,
      data: {
          labels: chart.labels,
          datasets: [
          {
              label: this.data.labels,
              backgroundColor: chart.backgroundColor,
              borderColor: chart.borderColor,
              data: this.data.values,
              borderWidth: 3
          }
          ]
      },
      options: options
    });

  }

  onDrop(event, item) {

    const chartType = event.dataTransfer.getData('type');

    const config = new MatDialogConfig();
    config.disableClose = true;
    config.autoFocus = true;
    let dialogRef;
    let newChart;

    this.dataService.getData().subscribe(response => {
      config.data = response[0];

      if(chartType === 'line') {
        dialogRef = this.dialog.open(CreateLineChartComponent, config);
        dialogRef.afterClosed().subscribe(result => {
          if(result !== 0) {
            newChart = {
              htmlId: this.generateUniqueHtmlId(),
              type: chartType,
              title: result.formValue.chartTitle,
              label: result.formValue.chartLabel,
              backgroundColor: [result.formValue.chartBackgroundColor],
              borderColor: [result.formValue.chartBorderColor],
              labels: result.data.labels,
              data: result.data.values,
              coordinates: {
                x: item.x,
                y: item.y,
                cols: 7,
                rows: 4
              }
            };
            this.activeDashboard.charts.push(newChart);
            this.createChartFromEdit(newChart);
            this.dashboardService.updateDashboard(this.activeDashboard).subscribe(res => {});
          }
        });
      } else {
        dialogRef = this.dialog.open(CreateBarChartComponent, config);
        dialogRef.afterClosed().subscribe(result => {
          if(result !== 0) {
            newChart = {
              htmlId: this.generateUniqueHtmlId(),
              type: chartType,
              title: result.formValue.chartTitle,
              label: result.formValue.chartLabel,
              backgroundColor: result.formValue.backgroundColors,
              borderColor: result.formValue.borderColors,
              labels: result.data.labels,
              data: result.data.values,
              coordinates: {
                x: item.x,
                y: item.y,
                cols: 7,
                rows: 4
              }
            };
            this.activeDashboard.charts.push(newChart);
            this.createChartFromEdit(newChart);
            this.dashboardService.updateDashboard(this.activeDashboard).subscribe(res => {});
          }
        });
      }
    });
    
  }

  generateUniqueHtmlId(): string {    
    
    let uniqueIds = [];
    this.activeDashboard.charts.forEach(chart => {
      let idSplit = chart.htmlId.split('-');
      idSplit = idSplit[1];
      uniqueIds.push(Number(idSplit));
    });

    for(let i=0; i < 640; i++) {
      if(!uniqueIds.includes(i)) {
        return `html-${i}`
      }
    }

    return '';

  }

}