# 🎓 DECP Platform - Department Engagement & Career Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

A comprehensive social networking platform connecting university students with alumni, facilitating career opportunities, and fostering research collaboration.

![DECP Platform Preview](docs/images/preview.png)

## 🚀 Features

### 👥 User Management
- ✅ Secure registration with email verification
- ✅ Role-based access (Student, Alumni, Admin)
- ✅ Profile customization with skills & experience
- ✅ Connection management

### 📱 Social Feed
- ✅ Create text, image, and video posts
- ✅ Like, comment, and share functionality
- ✅ Infinite scroll feed
- ✅ Real-time updates

### 💼 Jobs & Internships
- ✅ Job posting and applications
- ✅ Resume upload and management
- ✅ Application tracking
- ✅ Job recommendations

### 📅 Events & Announcements
- ✅ Event creation and management
- ✅ RSVP system
- ✅ Calendar integration
- ✅ Automated reminders

### 🔬 Research Collaboration
- ✅ Research project management
- ✅ Document sharing with version control
- ✅ Collaborator management
- ✅ Publication tracking

### 💬 Messaging
- ✅ Direct messaging
- ✅ Group chat
- ✅ Real-time messaging
- ✅ File sharing

### 📊 Analytics Dashboard
- ✅ User activity metrics
- ✅ Popular content analysis
- ✅ Job application statistics
- ✅ Engagement reports

## 🏗️ Architecture

DECP Platform follows a **microservices architecture** with **Service-Oriented Architecture (SOA)** principles:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                           │
│         Web (React)    Mobile (RN)    Admin (React)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                 │
│              (Auth, Rate Limiting, Routing)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │  Auth   │   │  User   │   │  Feed   │
        │ Service │   │ Service │   │ Service │
        └─────────┘   └─────────┘   └─────────┘
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │  Jobs   │   │ Events  │   │ Research│
        │ Service │   │ Service │   │ Service │
        └─────────┘   └─────────┘   └─────────┘
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │Messaging│   │Notification│ │Analytics│
        │ Service │   │  Service   │ │ Service │
        └─────────┘   └────────────┘ └─────────┘
```

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 15+
- **Cache:** Redis
- **Message Queue:** RabbitMQ
- **Real-time:** Socket.io

### Frontend (Web)
- **Framework:** React 18+
- **Language:** TypeScript
- **Build Tool:** Vite
- **State Management:** Redux Toolkit
- **UI Library:** Material-UI v5 + Tailwind CSS

### Mobile
- **Framework:** React Native with Expo
- **State Management:** Redux Toolkit
- **Navigation:** React Navigation v6

### DevOps
- **Containerization:** Docker & Docker Compose
- **Orchestration:** Kubernetes
- **Cloud:** AWS (EC2, RDS, S3, CloudFront)
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana

## 📁 Project Structure

```
decp-platform/
├── backend/                 # Microservices
│   ├── api-gateway/        # API Gateway (Port: 3000)
│   ├── auth-service/       # Authentication (Port: 3001)
│   ├── user-service/       # User Management (Port: 3002)
│   ├── feed-service/       # Social Feed (Port: 3003)
│   ├── jobs-service/       # Job Board (Port: 3004)
│   ├── events-service/     # Events (Port: 3005)
│   ├── research-service/   # Research Projects (Port: 3006)
│   ├── messaging-service/  # Chat (Port: 3007)
│   ├── notification-service/ # Notifications (Port: 3008)
│   └── analytics-service/  # Analytics (Port: 3009)
├── frontend/               # React Web App
├── mobile/                 # React Native Mobile App
├── infrastructure/         # Docker, K8s, Terraform
├── tests/                  # Test Suite
├── docs/                   # Documentation
├── diagrams/               # Architecture Diagrams
└── README.md              # This file
```

## 🚦 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis (or use Docker)

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/university/decp-platform.git
cd decp-platform

# Start all services with Docker Compose
docker-compose -f backend/docker-compose.yml up -d

# Access the application
Web App: http://localhost:5173
API Gateway: http://localhost:3000
```

### Option 2: Local Development

```bash
# 1. Install dependencies for all services
cd backend
npm run install:all

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# 3. Run database migrations
npm run db:migrate

# 4. Start all services
npm run dev

# 5. Start frontend (new terminal)
cd ../frontend
npm install
npm run dev

# 6. Start mobile (new terminal)
cd ../mobile
npm install
npm start
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Project Overview](docs/01-PROJECT_OVERVIEW.md) | Executive summary and goals |
| [Architecture](docs/02-ARCHITECTURE.md) | System architecture details |
| [API Documentation](docs/03-API_DOCUMENTATION.md) | Complete API reference |
| [Development Guide](docs/05-DEVELOPMENT_GUIDE.md) | Setup and development |
| [Deployment Guide](docs/06-DEPLOYMENT_GUIDE.md) | Production deployment |
| [Security](docs/07-SECURITY.md) | Security documentation |
| [Research Findings](docs/10-RESEARCH_FINDINGS.md) | Platform analysis |

## 🧪 Testing

```bash
# Run all tests
npm run test:all

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run test:performance
```

## 📊 Performance

- **API Response Time:** < 200ms (p95)
- **Page Load Time:** < 2s
- **Concurrent Users:** 10,000+
- **Availability:** 99.9%

## 🔒 Security

- JWT-based authentication
- Role-based access control (RBAC)
- HTTPS/TLS encryption
- SQL injection prevention
- XSS protection
- Rate limiting
- OWASP Top 10 compliance

## 🌐 Deployment

### AWS (Production)
```bash
cd infrastructure/terraform
terraform init
terraform apply
```

### Kubernetes
```bash
cd infrastructure/k8s
kubectl apply -f .
```

## 🤝 Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

| Role | Name |
|------|------|
| Enterprise Architect | [Name] |
| Solution Architect | [Name] |
| Application Architect | [Name] |
| Security Architect | [Name] |
| DevOps Architect | [Name] |

## 🙏 Acknowledgments

- Department of Computer Engineering, University of Peradeniya
- CO528 Applied Software Architecture Course
- All contributors and testers

## 📞 Support

- **Email:** decp@eng.pdn.ac.lk
- **Issues:** [GitHub Issues](https://github.com/university/decp-platform/issues)
- **Documentation:** [Full Docs](docs/)

---

<p align="center">
  Made with ❤️ by the DECP Team
</p>
