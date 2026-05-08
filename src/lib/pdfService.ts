import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export interface NutritionPlanData {
  bmr: number;
  tdee: number;
  calories: number;
  protein: { range: string; max: number };
  carbs: number;
  fat: number;
  warnings: string[];
}

export interface WorkoutReportData {
  totalWorkouts: number;
  totalExercises: number;
  personalBests: any[];
  exerciseProgress: any[];
  weeklyProgress: { count: number; goal: number; percentage: number };
  recentWorkouts: any[];
  activityLog: any[];
}

class PDFService {
  private runwayApiKey = '';

  // Generate nutrition plan template
  async generateNutritionPlanPDF(data: NutritionPlanData): Promise<Blob> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Set colors for branding
      const primaryColor = [102, 126, 234]; // #667eea
      const secondaryColor = [118, 75, 162]; // #764ba2
      const accentColor = [231, 76, 60]; // #e74c3c
      const successColor = [39, 174, 96]; // #27ae60
      const warningColor = [243, 156, 18]; // #f39c12
      
      // Header with gradient effect
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(0, 0, pageWidth, 45, 'F');
      
      // Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(32);
      pdf.setFont('helvetica', 'bold');
      pdf.text('NUTRITION MACRO PLAN', pageWidth / 2, 28);
      
      // Subtitle
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, 38);
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Energy Requirements Section
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ENERGY REQUIREMENTS', 20, 65);
      
      // BMR Card
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(20, 75, 85, 35, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BMR', 62.5, 87);
      pdf.setFontSize(18);
      pdf.text(`${data.bmr.toLocaleString()}`, 62.5, 98);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('calories at rest', 62.5, 106);
      
      // TDEE Card
      pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      pdf.rect(115, 75, 85, 35, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TDEE', 157.5, 87);
      pdf.setFontSize(18);
      pdf.text(`${data.tdee.toLocaleString()}`, 157.5, 98);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('daily target', 157.5, 106);
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Macro Breakdown Section
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MACRO BREAKDOWN', 20, 130);
      
      // Daily Target
      pdf.setFillColor(240, 248, 255);
      pdf.rect(20, 140, 170, 18, 'F');
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Daily Target: ${data.calories.toLocaleString()} calories`, 25, 151);
      
      // Protein Section
      pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      pdf.rect(20, 155, 170, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PROTEIN', 25, 165);
      pdf.setFontSize(16);
      pdf.text(data.protein.range, 25, 175);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Aim for ${data.protein.max}g per day for optimal results`, 25, 182);
      
      // Carbs Section
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(20, 190, 170, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CARBOHYDRATES', 25, 200);
      pdf.setFontSize(16);
      pdf.text(`${data.carbs}g (${Math.round((data.carbs * 4 / data.calories) * 100)}% of calories)`, 25, 210);
      
      // Fat Section
      pdf.setFillColor(warningColor[0], warningColor[1], warningColor[2]);
      pdf.rect(20, 220, 170, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FAT', 25, 230);
      pdf.setFontSize(16);
      pdf.text(`${data.fat}g (${Math.round((data.fat * 9 / data.calories) * 100)}% of calories)`, 25, 240);
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Meal Planning Tips Section
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MEAL PLANNING TIPS', 20, 270);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const tips = [
        '• Eat every 3-4 hours to maintain stable energy levels',
        '• Include protein with every meal (20-40g)',
        '• Pre-workout: Carbs + moderate protein 2-3 hours before',
        '• Post-workout: Protein + carbs within 30 minutes',
        '• Stay hydrated: Aim for 8-10 glasses of water daily',
        '• Track your progress and adjust as needed'
      ];
      
      tips.forEach((tip, index) => {
        pdf.text(tip, 25, 285 + (index * 8));
      });
      
      // Warnings Section (if any)
      if (data.warnings.length > 0) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('IMPORTANT CONSIDERATIONS', 20, 340);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        data.warnings.forEach((warning, index) => {
          pdf.text(`• ${warning.replace('⚠️ ', '')}`, 25, 350 + (index * 6));
        });
      }
      
      // Footer with branding
      pdf.setFillColor(240, 240, 240);
      pdf.rect(0, pageHeight - 30, pageWidth, 30, 'F');
      
      // FitForge Buddy logo and branding
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text('FitForge Buddy', pageWidth / 2, pageHeight - 20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Your AI-Powered Fitness Companion', pageWidth / 2, pageHeight - 15);
      pdf.text('Generated by FitForge Buddy • For personal nutrition planning use only', pageWidth / 2, pageHeight - 10);
      
      // Add website link for advertising
      pdf.setFontSize(9);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text('Visit: fitforgebuddy.com', pageWidth / 2, pageHeight - 5);
      
      const pdfBlob = pdf.output('blob');
      return pdfBlob;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }

  // Generate workout report template
  async generateWorkoutReportPDF(data: WorkoutReportData): Promise<Blob> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Set colors for branding
      const primaryColor = [102, 126, 234]; // #667eea
      const secondaryColor = [118, 75, 162]; // #764ba2
      const accentColor = [231, 76, 60]; // #e74c3c
      const successColor = [39, 174, 96]; // #27ae60
      const warningColor = [243, 156, 18]; // #f39c12
      const purpleColor = [155, 89, 182]; // #9b59b6
      const tealColor = [26, 188, 156]; // #1abc9c
      
      // Header with gradient effect
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(0, 0, pageWidth, 45, 'F');
      
      // Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(32);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FITNESS WORKOUT REPORT', pageWidth / 2, 28);
      
      // Subtitle
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, 38);
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Summary Section
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SUMMARY', 20, 60);
      
      // Summary Cards Grid
      const cardWidth = 40;
      const cardHeight = 25;
      const startX = 20;
      const startY = 70;
      
      // Total Workouts Card
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(startX, startY, cardWidth, cardHeight, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Workouts', startX + cardWidth/2, startY + 8);
      pdf.setFontSize(16);
      pdf.text(data.totalWorkouts.toString(), startX + cardWidth/2, startY + 18);
      
      // Total Exercises Card
      pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      pdf.rect(startX + cardWidth + 5, startY, cardWidth, cardHeight, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Exercises', startX + cardWidth + 5 + cardWidth/2, startY + 8);
      pdf.setFontSize(16);
      pdf.text(data.totalExercises.toString(), startX + cardWidth + 5 + cardWidth/2, startY + 18);
      
      // Personal Bests Card
      pdf.setFillColor(warningColor[0], warningColor[1], warningColor[2]);
      pdf.rect(startX + (cardWidth + 5) * 2, startY, cardWidth, cardHeight, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PBs', startX + (cardWidth + 5) * 2 + cardWidth/2, startY + 8);
      pdf.setFontSize(16);
      pdf.text(data.personalBests.length.toString(), startX + (cardWidth + 5) * 2 + cardWidth/2, startY + 18);
      
      // Weekly Progress Card
      pdf.setFillColor(successColor[0], successColor[1], successColor[2]);
      pdf.rect(startX + (cardWidth + 5) * 3, startY, cardWidth, cardHeight, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Progress', startX + (cardWidth + 5) * 3 + cardWidth/2, startY + 8);
      pdf.setFontSize(16);
      pdf.text(`${data.weeklyProgress.count}/${data.weeklyProgress.goal}`, startX + (cardWidth + 5) * 3 + cardWidth/2, startY + 18);
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Personal Bests Section
      if (data.personalBests.length > 0) {
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('PERSONAL BESTS', 20, 120);
        
        data.personalBests.slice(0, 6).forEach((pb, index) => {
          const row = Math.floor(index / 2);
          const col = index % 2;
          const x = 20 + (col * 90);
          const y = 130 + (row * 20);
          
          pdf.setFillColor(warningColor[0], warningColor[1], warningColor[2]);
          pdf.rect(x, y, 85, 15, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${pb.exercise}`, x + 5, y + 10);
          
          if (pb.maxWeight > 0) {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`${pb.maxWeight} lbs`, x + 5, y + 20);
          }
        });
        
        // Reset text color
        pdf.setTextColor(0, 0, 0);
      }
      
      // Exercise Progress Section
      if (data.exerciseProgress.length > 0) {
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('EXERCISE PROGRESS', 20, 200);
        
        data.exerciseProgress.slice(0, 3).forEach((exercise, index) => {
          const y = 210 + (index * 25);
          
          pdf.setFillColor(purpleColor[0], purpleColor[1], purpleColor[2]);
          pdf.rect(20, y, 170, 20, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${exercise.name}`, 25, y + 8);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Sets: ${exercise.totalSets} | Max: ${exercise.maxWeight} lbs | Improvement: ${Math.round(exercise.improvement)}%`, 25, y + 16);
        });
        
        // Reset text color
        pdf.setTextColor(0, 0, 0);
      }
      
      // Recent Workouts Section
      if (data.recentWorkouts.length > 0) {
        pdf.setFontSize(18);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('RECENT WORKOUTS', 20, 300);
        
        data.recentWorkouts.slice(0, 5).forEach((workout, index) => {
          const y = 310 + (index * 12);
          const date = new Date(workout.date).toLocaleDateString();
          
          pdf.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
          pdf.rect(20, y, 170, 10, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${date}`, 25, y + 7);
          
          if (workout.session && workout.session.length > 0) {
            const exerciseCount = workout.session.length;
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`${exerciseCount} exercises`, 120, y + 7);
          }
        });
        
        // Reset text color
        pdf.setTextColor(0, 0, 0);
      }
      
      // Footer with branding
      pdf.setFillColor(240, 240, 240);
      pdf.rect(0, pageHeight - 30, pageWidth, 30, 'F');
      
      // FitForge Buddy logo and branding
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text('FitForge Buddy', pageWidth / 2, pageHeight - 20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Your AI-Powered Fitness Companion', pageWidth / 2, pageHeight - 15);
      pdf.text('Generated by FitForge Buddy • For personal fitness tracking use only', pageWidth / 2, pageHeight - 10);
      
      // Add website link for advertising
      pdf.setFontSize(9);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text('Visit: fitforgebuddy.com', pageWidth / 2, pageHeight - 5);
      
      const pdfBlob = pdf.output('blob');
      return pdfBlob;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }

  private createTemplateElement(html: string): HTMLElement {
    const element = document.createElement('div');
    element.innerHTML = html;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';
    element.style.width = '800px';
    element.style.backgroundColor = 'white';
    element.style.padding = '40px';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.color = '#333';
    element.style.boxSizing = 'border-box';
    element.style.overflow = 'hidden';
    element.style.zIndex = '-1';
    return element;
  }

  private createNutritionPlanTemplate(data: NutritionPlanData): string {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    return `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 20px; color: white; margin-bottom: 30px;">
        <h1 style="font-size: 36px; margin: 0; text-align: center; font-weight: bold;">NUTRITION MACRO PLAN</h1>
        <p style="text-align: center; margin: 10px 0 0 0; opacity: 0.9;">Generated on ${date} at ${time}</p>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-bottom: 30px;">
        <h2 style="color: #2c3e50; font-size: 24px; margin: 0 0 20px 0; border-bottom: 3px solid #3498db; padding-bottom: 10px;">
          ⚡ ENERGY REQUIREMENTS
        </h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; border-left: 4px solid #3498db;">
            <h3 style="color: #3498db; margin: 0 0 10px 0; font-size: 18px;">BMR</h3>
            <p style="font-size: 28px; font-weight: bold; color: #2c3e50; margin: 0;">${data.bmr.toLocaleString()}</p>
            <p style="color: #7f8c8d; margin: 5px 0 0 0; font-size: 14px;">calories burned at rest</p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; border-left: 4px solid #e74c3c;">
            <h3 style="color: #e74c3c; margin: 0 0 10px 0; font-size: 18px;">TDEE</h3>
            <p style="font-size: 28px; font-weight: bold; color: #2c3e50; margin: 0;">${data.tdee.toLocaleString()}</p>
            <p style="color: #7f8c8d; margin: 5px 0 0 0; font-size: 14px;">daily calorie target</p>
          </div>
        </div>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-bottom: 30px;">
        <h2 style="color: #2c3e50; font-size: 24px; margin: 0 0 20px 0; border-bottom: 3px solid #e67e22; padding-bottom: 10px;">
          🎯 MACRO BREAKDOWN
        </h2>
        <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
          <h3 style="color: #e67e22; margin: 0 0 15px 0; font-size: 20px;">Daily Target: ${data.calories.toLocaleString()} calories</h3>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
          <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #e74c3c;">
            <h4 style="color: #e74c3c; margin: 0 0 10px 0; font-size: 18px;">🥩 PROTEIN</h4>
            <p style="font-size: 24px; font-weight: bold; color: #2c3e50; margin: 0 0 10px 0;">${data.protein.range}</p>
            <ul style="color: #7f8c8d; margin: 0; padding-left: 20px; font-size: 14px;">
              <li>Evidence-based range for your training level</li>
              <li>Aim for ${data.protein.max}g per day for optimal results</li>
              <li>Distribute across 4-5 meals every 3-4 hours</li>
            </ul>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #3498db;">
            <h4 style="color: #3498db; margin: 0 0 10px 0; font-size: 18px;">🍞 CARBOHYDRATES</h4>
            <p style="font-size: 24px; font-weight: bold; color: #2c3e50; margin: 0 0 10px 0;">${data.carbs}g</p>
            <p style="color: #7f8c8d; margin: 0; font-size: 14px;">${Math.round((data.carbs * 4 / data.calories) * 100)}% of total calories • Primary fuel source</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #f39c12;">
            <h4 style="color: #f39c12; margin: 0 0 10px 0; font-size: 18px;">🥑 FAT</h4>
            <p style="font-size: 24px; font-weight: bold; color: #2c3e50; margin: 0 0 10px 0;">${data.fat}g</p>
            <p style="color: #7f8c8d; margin: 0; font-size: 14px;">${Math.round((data.fat * 9 / data.calories) * 100)}% of total calories • Essential for hormones</p>
          </div>
        </div>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-bottom: 30px;">
        <h2 style="color: #2c3e50; font-size: 24px; margin: 0 0 20px 0; border-bottom: 3px solid #27ae60; padding-bottom: 10px;">
          💡 MEAL PLANNING TIPS
        </h2>
        <div style="background: white; padding: 25px; border-radius: 10px;">
          <ul style="color: #2c3e50; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Eat every 3-4 hours to maintain stable energy levels</li>
            <li>Include protein with every meal (20-40g)</li>
            <li>Pre-workout: Carbs + moderate protein 2-3 hours before</li>
            <li>Post-workout: Protein + carbs within 30 minutes</li>
            <li>Stay hydrated: Aim for 8-10 glasses of water daily</li>
            <li>Track your progress and adjust as needed</li>
          </ul>
        </div>
      </div>

      ${data.warnings.length > 0 ? `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
          <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">⚠️ IMPORTANT CONSIDERATIONS</h3>
          <ul style="color: #856404; margin: 0; padding-left: 20px;">
            ${data.warnings.map(warning => `<li>${warning.replace('⚠️ ', '')}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div style="text-align: center; padding: 20px; background: #ecf0f1; border-radius: 10px; margin-top: 30px;">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          Generated by FitForge Buddy • For personal nutrition planning use only
        </p>
      </div>
    `;
  }

  private createWorkoutReportTemplate(data: WorkoutReportData): string {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    return `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 20px; color: white; margin-bottom: 30px;">
        <h1 style="font-size: 36px; margin: 0; text-align: center; font-weight: bold;">FITNESS WORKOUT REPORT</h1>
        <p style="text-align: center; margin: 10px 0 0 0; opacity: 0.9;">Generated on ${date} at ${time}</p>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-bottom: 30px;">
        <h2 style="color: #2c3e50; font-size: 24px; margin: 0 0 20px 0; border-bottom: 3px solid #3498db; padding-bottom: 10px;">
          📊 SUMMARY
        </h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; border-left: 4px solid #3498db;">
            <h3 style="color: #3498db; margin: 0 0 10px 0; font-size: 18px;">Total Workouts</h3>
            <p style="font-size: 28px; font-weight: bold; color: #2c3e50; margin: 0;">${data.totalWorkouts}</p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; border-left: 4px solid #e74c3c;">
            <h3 style="color: #e74c3c; margin: 0 0 10px 0; font-size: 18px;">Exercises Tracked</h3>
            <p style="font-size: 28px; font-weight: bold; color: #2c3e50; margin: 0;">${data.totalExercises}</p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; border-left: 4px solid #f39c12;">
            <h3 style="color: #f39c12; margin: 0 0 10px 0; font-size: 18px;">Personal Bests</h3>
            <p style="font-size: 28px; font-weight: bold; color: #2c3e50; margin: 0;">${data.personalBests.length}</p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; border-left: 4px solid #27ae60;">
            <h3 style="color: #27ae60; margin: 0 0 10px 0; font-size: 18px;">Weekly Progress</h3>
            <p style="font-size: 28px; font-weight: bold; color: #2c3e50; margin: 0;">${data.weeklyProgress.count}/${data.weeklyProgress.goal}</p>
            <p style="color: #7f8c8d; margin: 5px 0 0 0; font-size: 14px;">${Math.round(data.weeklyProgress.percentage)}% complete</p>
          </div>
        </div>
      </div>

      ${data.personalBests.length > 0 ? `
        <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-bottom: 30px;">
          <h2 style="color: #2c3e50; font-size: 24px; margin: 0 0 20px 0; border-bottom: 3px solid #e67e22; padding-bottom: 10px;">
            🏆 PERSONAL BESTS
          </h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            ${data.personalBests.slice(0, 6).map((pb, index) => `
              <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #e67e22;">
                <h4 style="color: #e67e22; margin: 0 0 10px 0; font-size: 16px;">${index + 1}. ${pb.exercise}</h4>
                ${pb.maxWeight > 0 ? `<p style="color: #2c3e50; margin: 5px 0; font-size: 14px;"><strong>Max Weight:</strong> ${pb.maxWeight} lbs</p>` : ''}
                ${pb.maxReps > 0 ? `<p style="color: #2c3e50; margin: 5px 0; font-size: 14px;"><strong>Max Reps:</strong> ${pb.maxReps}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${data.exerciseProgress.length > 0 ? `
        <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-bottom: 30px;">
          <h2 style="color: #2c3e50; font-size: 24px; margin: 0 0 20px 0; border-bottom: 3px solid #9b59b6; padding-bottom: 10px;">
            📈 EXERCISE PROGRESS
          </h2>
          <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
            ${data.exerciseProgress.slice(0, 5).map((exercise, index) => `
              <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #9b59b6;">
                <h4 style="color: #9b59b6; margin: 0 0 10px 0; font-size: 18px;">${index + 1}. ${exercise.name}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                  <div><strong>Workouts:</strong> ${exercise.totalWorkouts}</div>
                  <div><strong>Sets:</strong> ${exercise.totalSets}</div>
                  <div><strong>Max Weight:</strong> ${exercise.maxWeight} lbs</div>
                  <div><strong>Max Reps:</strong> ${exercise.maxReps}</div>
                  <div><strong>Improvement:</strong> ${exercise.improvement > 0 ? '+' : ''}${Math.round(exercise.improvement)}%</div>
                  <div><strong>Consistency:</strong> ${Math.round(exercise.consistency)}%</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${data.recentWorkouts.length > 0 ? `
        <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-bottom: 30px;">
          <h2 style="color: #2c3e50; font-size: 24px; margin: 0 0 20px 0; border-bottom: 3px solid #1abc9c; padding-bottom: 10px;">
            🏋️ RECENT WORKOUTS
          </h2>
          <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
            ${data.recentWorkouts.slice(0, 5).map((workout, index) => `
              <div style="background: white; padding: 15px; border-radius: 10px; border-left: 4px solid #1abc9c;">
                <h4 style="color: #1abc9c; margin: 0 0 8px 0; font-size: 16px;">${index + 1}. ${new Date(workout.date).toLocaleDateString()}</h4>
                ${workout.session && workout.session.length > 0 ? 
                  workout.session.map((exercise: any) => 
                    `<p style="color: #2c3e50; margin: 3px 0; font-size: 14px;">• ${exercise.name}: ${exercise.sets?.length || 0} sets</p>`
                  ).join('') : 
                  '<p style="color: #7f8c8d; font-size: 14px;">No exercise data</p>'
                }
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-bottom: 30px;">
        <h2 style="color: #2c3e50; font-size: 24px; margin: 0 0 20px 0; border-bottom: 3px solid #34495e; padding-bottom: 10px;">
          📅 ACTIVITY LOG (Last 30 Days)
        </h2>
        <div style="background: white; padding: 20px; border-radius: 10px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
            ${data.activityLog.slice(0, 20).map((activity, index) => `
              <div style="padding: 8px; background: ${activity.type === 'workout' ? '#d5f4e6' : '#f8f9fa'}; border-radius: 5px;">
                <strong>${activity.date}:</strong> ${activity.summary}
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div style="text-align: center; padding: 20px; background: #ecf0f1; border-radius: 10px; margin-top: 30px;">
        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
          Generated by FitForge Buddy • For personal fitness tracking use only
        </p>
      </div>
    `;
  }
}

export const pdfService = new PDFService(); 