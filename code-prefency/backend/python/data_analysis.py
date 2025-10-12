#!/usr/bin/env python3
"""
Python Data Science và Machine Learning
Ứng dụng phân tích dữ liệu với pandas, numpy, scikit-learn, và matplotlib
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_squared_error, classification_report, confusion_matrix
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import warnings
warnings.filterwarnings('ignore')

# Set style cho matplotlib
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class DataAnalyzer:
    """Lớp phân tích dữ liệu toàn diện"""

    def __init__(self, data_path=None):
        self.data = None
        self.processed_data = None
        self.models = {}
        self.scaler = StandardScaler()

        if data_path:
            self.load_data(data_path)

    def load_data(self, path, separator=','):
        """Tải dữ liệu từ file CSV"""
        try:
            self.data = pd.read_csv(path, sep=separator)
            print(f"✅ Đã tải dữ liệu từ {path}")
            print(f"📊 Kích thước: {self.data.shape}")
            print(f"📋 Các cột: {list(self.data.columns)}")
            return True
        except Exception as e:
            print(f"❌ Lỗi tải dữ liệu: {e}")
            return False

    def explore_data(self):
        """Khám phá dữ liệu cơ bản"""
        if self.data is None:
            print("❌ Chưa tải dữ liệu")
            return

        print("\n📊 THÔNG TIN TỔNG QUAN:")
        print("=" * 50)
        print(self.data.info())

        print("\n📈 THỐNG KÊ MÔ TẢ:")
        print("=" * 50)
        print(self.data.describe())

        print("\n🔍 KIỂM TRA GIÁ TRỊ NULL:")
        print("=" * 50)
        null_counts = self.data.isnull().sum()
        print(null_counts[null_counts > 0])

        print("\n📊 PHÂN PHỐI DỮ LIỆU:")
        print("=" * 50)
        for col in self.data.columns:
            if self.data[col].dtype in ['int64', 'float64']:
                print(f"{col}: {self.data[col].skew():.2f} (skewness)")

    def clean_data(self):
        """Làm sạch dữ liệu"""
        if self.data is None:
            print("❌ Chưa tải dữ liệu")
            return

        self.processed_data = self.data.copy()

        # Xử lý giá trị null
        for col in self.processed_data.columns:
            if self.processed_data[col].isnull().sum() > 0:
                if self.processed_data[col].dtype in ['int64', 'float64']:
                    # Điền giá trị trung bình cho số
                    mean_val = self.processed_data[col].mean()
                    self.processed_data[col].fillna(mean_val, inplace=True)
                    print(f"✅ Điền giá trị trung bình {mean_val:.2f} cho cột {col}")
                else:
                    # Điền giá trị phổ biến nhất cho category
                    mode_val = self.processed_data[col].mode()[0]
                    self.processed_data[col].fillna(mode_val, inplace=True)
                    print(f"✅ Điền giá trị phổ biến '{mode_val}' cho cột {col}")

        # Loại bỏ dữ liệu trùng lặp
        duplicates = self.processed_data.duplicated().sum()
        if duplicates > 0:
            self.processed_data.drop_duplicates(inplace=True)
            print(f"✅ Loại bỏ {duplicates} bản ghi trùng lặp")

        print("✅ Làm sạch dữ liệu hoàn thành!")

    def visualize_data(self):
        """Trực quan hóa dữ liệu"""
        if self.processed_data is None:
            print("❌ Chưa xử lý dữ liệu")
            return

        # Thiết lập figure
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Phân tích dữ liệu trực quan', fontsize=16, fontweight='bold')

        # Histogram cho tất cả biến số
        numeric_cols = self.processed_data.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            self.processed_data[numeric_cols].hist(ax=axes[0, 0], bins=20, alpha=0.7)
            axes[0, 0].set_title('Phân bố các biến số')
            axes[0, 0].tick_params(axis='x', rotation=45)

        # Box plot để phát hiện outliers
        if len(numeric_cols) > 0:
            sns.boxplot(data=self.processed_data[numeric_cols], ax=axes[0, 1])
            axes[0, 1].set_title('Box plot - Phát hiện outliers')
            axes[0, 1].tick_params(axis='x', rotation=45)

        # Correlation heatmap
        if len(numeric_cols) > 1:
            corr_matrix = self.processed_data[numeric_cols].corr()
            sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', center=0,
                       square=True, ax=axes[1, 0])
            axes[1, 0].set_title('Ma trận tương quan')

        # Scatter plot cho mối quan hệ giữa 2 biến đầu tiên
        if len(numeric_cols) >= 2:
            x_col, y_col = numeric_cols[0], numeric_cols[1]
            axes[1, 1].scatter(self.processed_data[x_col], self.processed_data[y_col], alpha=0.6)
            axes[1, 1].set_xlabel(x_col)
            axes[1, 1].set_ylabel(y_col)
            axes[1, 1].set_title(f'Mối quan hệ {x_col} vs {y_col}')

        plt.tight_layout()
        plt.savefig('data_analysis_report.png', dpi=300, bbox_inches='tight')
        plt.show()

    def perform_clustering(self, n_clusters=3):
        """Thực hiện phân cụm K-Means"""
        if self.processed_data is None:
            print("❌ Chưa xử lý dữ liệu")
            return

        # Chuẩn bị dữ liệu cho clustering
        numeric_data = self.processed_data.select_dtypes(include=[np.number])

        if numeric_data.empty:
            print("❌ Không có dữ liệu số để phân cụm")
            return

        # Chuẩn hóa dữ liệu
        scaled_data = self.scaler.fit_transform(numeric_data)

        # Thực hiện K-Means
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(scaled_data)

        # Thêm kết quả vào dữ liệu
        self.processed_data['Cluster'] = clusters

        print(f"✅ Phân cụm hoàn thành với {n_clusters} cụm")
        print(f"📊 Kích thước các cụm: {np.bincount(clusters)}")

        # Trực quan hóa kết quả
        plt.figure(figsize=(10, 6))
        scatter = plt.scatter(scaled_data[:, 0], scaled_data[:, 1],
                            c=clusters, cmap='viridis', alpha=0.6)
        plt.scatter(kmeans.cluster_centers_[:, 0], kmeans.cluster_centers_[:, 1],
                   c='red', marker='X', s=200, label='Centers')
        plt.title('Kết quả phân cụm K-Means')
        plt.xlabel('Feature 1 (scaled)')
        plt.ylabel('Feature 2 (scaled)')
        plt.legend()
        plt.colorbar(scatter)
        plt.savefig('clustering_results.png', dpi=300, bbox_inches='tight')
        plt.show()

        return clusters

    def train_classification_model(self, target_column, test_size=0.2):
        """Huấn luyện mô hình phân loại"""
        if self.processed_data is None:
            print("❌ Chưa xử lý dữ liệu")
            return

        if target_column not in self.processed_data.columns:
            print(f"❌ Không tìm thấy cột mục tiêu: {target_column}")
            return

        # Chuẩn bị dữ liệu
        X = self.processed_data.drop(columns=[target_column])
        y = self.processed_data[target_column]

        # Encode categorical variables
        le = LabelEncoder()
        for col in X.columns:
            if X[col].dtype == 'object':
                X[col] = le.fit_transform(X[col])

        # Chia dữ liệu
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )

        # Chuẩn hóa dữ liệu
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Huấn luyện mô hình
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train_scaled, y_train)

        # Dự đoán và đánh giá
        y_pred = model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)

        print("📊 KẾT QUẢ MÔ HÌNH PHÂN LOẠI:")
        print("=" * 50)
        print(f"🎯 Độ chính xác: {accuracy:.4f}")
        print(f"📈 Classification Report:\n{classification_report(y_test, y_pred)}")

        # Confusion Matrix
        plt.figure(figsize=(8, 6))
        cm = confusion_matrix(y_test, y_pred)
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=np.unique(y), yticklabels=np.unique(y))
        plt.title('Confusion Matrix')
        plt.xlabel('Predicted')
        plt.ylabel('Actual')
        plt.savefig('confusion_matrix.png', dpi=300, bbox_inches='tight')
        plt.show()

        # Feature Importance
        if hasattr(model, 'feature_importances_'):
            plt.figure(figsize=(10, 6))
            feature_importance = pd.DataFrame({
                'feature': X.columns,
                'importance': model.feature_importances_
            }).sort_values('importance', ascending=True)

            plt.barh(feature_importance['feature'], feature_importance['importance'])
            plt.title('Feature Importance')
            plt.xlabel('Importance')
            plt.tight_layout()
            plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')
            plt.show()

        self.models['classification'] = model
        return model, accuracy

    def train_regression_model(self, target_column, test_size=0.2):
        """Huấn luyện mô hình hồi quy"""
        if self.processed_data is None:
            print("❌ Chưa xử lý dữ liệu")
            return

        if target_column not in self.processed_data.columns:
            print(f"❌ Không tìm thấy cột mục tiêu: {target_column}")
            return

        # Chuẩn bị dữ liệu
        X = self.processed_data.drop(columns=[target_column])
        y = self.processed_data[target_column]

        # Encode categorical variables
        le = LabelEncoder()
        for col in X.columns:
            if X[col].dtype == 'object':
                X[col] = le.fit_transform(X[col])

        # Chia dữ liệu
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )

        # Chuẩn hóa dữ liệu
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Huấn luyện mô hình
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train_scaled, y_train)

        # Dự đoán và đánh giá
        y_pred = model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)

        print("📊 KẾT QUẢ MÔ HÌNH HỒI QUY:")
        print("=" * 50)
        print(f"📉 Mean Squared Error: {mse:.4f}")
        print(f"📈 Root Mean Squared Error: {rmse:.4f}")
        print(f"🎯 R² Score: {model.score(X_test_scaled, y_test):.4f}")

        # Biểu đồ dự đoán vs thực tế
        plt.figure(figsize=(8, 6))
        plt.scatter(y_test, y_pred, alpha=0.6)
        plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
        plt.xlabel('Giá trị thực tế')
        plt.ylabel('Giá trị dự đoán')
        plt.title('Dự đoán vs Thực tế')
        plt.savefig('regression_results.png', dpi=300, bbox_inches='tight')
        plt.show()

        # Residual plot
        residuals = y_test - y_pred
        plt.figure(figsize=(8, 6))
        plt.scatter(y_pred, residuals, alpha=0.6)
        plt.axhline(y=0, color='r', linestyle='--')
        plt.xlabel('Giá trị dự đoán')
        plt.ylabel('Residuals')
        plt.title('Residual Plot')
        plt.savefig('residual_plot.png', dpi=300, bbox_inches='tight')
        plt.show()

        self.models['regression'] = model
        return model, rmse

    def perform_pca(self, n_components=2):
        """Thực hiện PCA để giảm chiều dữ liệu"""
        if self.processed_data is None:
            print("❌ Chưa xử lý dữ liệu")
            return

        # Chuẩn bị dữ liệu số
        numeric_data = self.processed_data.select_dtypes(include=[np.number])

        if numeric_data.shape[1] < 2:
            print("❌ Cần ít nhất 2 cột số để thực hiện PCA")
            return

        # Loại bỏ cột mục tiêu nếu có
        if 'Cluster' in numeric_data.columns:
            numeric_data = numeric_data.drop('Cluster', axis=1)

        # Chuẩn hóa dữ liệu
        scaled_data = self.scaler.fit_transform(numeric_data)

        # Thực hiện PCA
        pca = PCA(n_components=n_components)
        pca_result = pca.fit_transform(scaled_data)

        # Tạo DataFrame với kết quả PCA
        pca_df = pd.DataFrame(
            pca_result,
            columns=[f'PC{i+1}' for i in range(n_components)]
        )

        print("📊 KẾT QUẢ PCA:")
        print("=" * 30)
        print(f"🎯 Số chiều gốc: {scaled_data.shape[1]}")
        print(f"🎯 Số chiều sau PCA: {n_components}")
        print(f"📈 Giải thích phương sai: {pca.explained_variance_ratio_}")
        print(f"📊 Tổng phương sai giải thích: {pca.explained_variance_ratio_.sum():.4f}")

        # Trực quan hóa kết quả PCA
        plt.figure(figsize=(10, 8))
        scatter = plt.scatter(pca_result[:, 0], pca_result[:, 1], alpha=0.6)

        # Thêm labels cho các điểm nếu có ít dữ liệu
        if len(pca_result) <= 50:
            for i, (x, y) in enumerate(pca_result[:50]):
                plt.annotate(f'Point {i+1}', (x, y), xytext=(5, 5),
                           textcoords='offset points', fontsize=8)

        plt.xlabel(f'Principal Component 1 ({pca.explained_variance_ratio_[0]:.2%} variance)')
        plt.ylabel(f'Principal Component 2 ({pca.explained_variance_ratio_[1]:.2%} variance)')
        plt.title('PCA Results - 2D Visualization')
        plt.grid(True, alpha=0.3)
        plt.savefig('pca_results.png', dpi=300, bbox_inches='tight')
        plt.show()

        return pca_df, pca

    def generate_report(self, filename="data_analysis_report.html"):
        """Tạo báo cáo phân tích dữ liệu"""
        if self.processed_data is None:
            print("❌ Chưa xử lý dữ liệu")
            return

        html_content = f"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Báo cáo phân tích dữ liệu</title>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; line-height: 1.6; }}
                .header {{ text-align: center; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 20px; }}
                .section {{ margin: 30px 0; }}
                .stats {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 10px 0; }}
                .highlight {{ background: #e8f5e8; padding: 15px; border-left: 4px solid #27ae60; }}
                img {{ max-width: 100%; height: auto; margin: 20px 0; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Báo cáo phân tích dữ liệu</h1>
                <p>Tạo bởi Python Data Analysis Tool</p>
                <p><strong>Ngày tạo:</strong> {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>

            <div class="section">
                <h2>📋 Thông tin dữ liệu</h2>
                <div class="stats">
                    <p><strong>Kích thước dữ liệu:</strong> {self.processed_data.shape[0]} hàng × {self.processed_data.shape[1]} cột</p>
                    <p><strong>Kiểu dữ liệu:</strong> {dict(self.processed_data.dtypes)}</p>
                </div>
            </div>

            <div class="section">
                <h2>📈 Thống kê mô tả</h2>
                <div class="stats">
                    {self.processed_data.describe().to_html()}
                </div>
            </div>

            <div class="section">
                <h2>🔍 Phát hiện vấn đề</h2>
                <div class="highlight">
                    <p><strong>Giá trị null:</strong> {self.processed_data.isnull().sum().sum()} giá trị bị thiếu</p>
                    <p><strong>Dữ liệu trùng lặp:</strong> {self.processed_data.duplicated().sum()} bản ghi trùng lặp</p>
                </div>
            </div>

            <div class="section">
                <h2>📊 Kết quả phân tích</h2>
                <div class="highlight">
                    <p>Báo cáo phân tích chi tiết đã được lưu vào các file hình ảnh:</p>
                    <ul>
                        <li>data_analysis_report.png - Tổng quan dữ liệu</li>
                        <li>clustering_results.png - Kết quả phân cụm</li>
                        <li>confusion_matrix.png - Ma trận nhầm lẫn</li>
                        <li>feature_importance.png - Tầm quan trọng đặc trưng</li>
                        <li>regression_results.png - Kết quả hồi quy</li>
                        <li>pca_results.png - Kết quả PCA</li>
                    </ul>
                </div>
            </div>

            <div class="section">
                <h2>💡 Khuyến nghị</h2>
                <div class="highlight">
                    <ul>
                        <li>Kiểm tra và xử lý outliers nếu cần thiết</li>
                        <li>Cân nhắc loại bỏ các đặc trưng có tương quan cao</li>
                        <li>Thu thập thêm dữ liệu nếu mô hình chưa đủ chính xác</li>
                        <li>Thử nghiệm các mô hình khác nhau để tìm mô hình tốt nhất</li>
                    </ul>
                </div>
            </div>
        </body>
        </html>
        """

        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html_content)

        print(f"✅ Báo cáo đã được lưu vào {filename}")

    def export_processed_data(self, filename="processed_data.csv"):
        """Xuất dữ liệu đã xử lý"""
        if self.processed_data is not None:
            self.processed_data.to_csv(filename, index=False)
            print(f"✅ Dữ liệu đã được xuất vào {filename}")
        else:
            print("❌ Chưa có dữ liệu để xuất")


# Ví dụ sử dụng
if __name__ == "__main__":
    # Khởi tạo analyzer
    analyzer = DataAnalyzer()

    # Ví dụ với dữ liệu mẫu (thay thế bằng đường dẫn thực tế)
    print("🚀 BẮT ĐẦU PHÂN TÍCH DỮ LIỆU")
    print("=" * 60)

    # Tải dữ liệu mẫu (thay thế bằng dữ liệu thực tế của bạn)
    sample_data = pd.DataFrame({
        'age': np.random.normal(30, 10, 100),
        'income': np.random.normal(50000, 15000, 100),
        'score': np.random.normal(70, 15, 100),
        'category': np.random.choice(['A', 'B', 'C'], 100),
        'satisfaction': np.random.choice(['Low', 'Medium', 'High'], 100)
    })

    analyzer.data = sample_data
    analyzer.processed_data = sample_data.copy()

    # Khám phá dữ liệu
    analyzer.explore_data()

    # Trực quan hóa
    print("\n📊 ĐANG TẠO BIỂU ĐỒ...")
    analyzer.visualize_data()

    # Phân cụm
    print("\n🔍 ĐANG THỰC HIỆN PHÂN CỤM...")
    analyzer.perform_clustering(n_clusters=3)

    # Hồi quy
    print("\n📈 ĐANG HUẤN LUYỆN MÔ HÌNH HỒI QUY...")
    analyzer.train_regression_model('income')

    # Phân loại
    print("\n🎯 ĐANG HUẤN LUYỆN MÔ HÌNH PHÂN LOẠI...")
    analyzer.train_classification_model('category')

    # PCA
    print("\n🧮 ĐANG THỰC HIỆN PCA...")
    analyzer.perform_pca(n_components=2)

    # Tạo báo cáo
    print("\n📋 ĐANG TẠO BÁO CÁO...")
    analyzer.generate_report()

    print("\n✅ PHÂN TÍCH HOÀN THÀNH!")
    print("📁 Kiểm tra các file đã tạo trong thư mục hiện tại")
