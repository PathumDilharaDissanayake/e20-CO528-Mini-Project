# DECP Platform Architecture Diagrams

This directory contains comprehensive architecture diagrams for the **Department Engagement & Career Platform (DECP)**, a university-focused social networking and career platform.

## 📁 Contents

| File | Description |
|------|-------------|
| `enterprise-architecture.mmd` | High-level enterprise view with business processes and workflows |
| `soa-architecture.mmd` | Service-Oriented Architecture with all 10 microservices |
| `c4-context.mmd` | C4 Level 1 - System Context diagram |
| `c4-container.mmd` | C4 Level 2 - Container diagram |
| `c4-component-gateway.mmd` | C4 Level 3 - API Gateway component diagram |
| `deployment-architecture.mmd` | AWS cloud deployment infrastructure |
| `data-flow.mmd` | Key data flows (registration, posts, jobs, messaging) |
| `network-architecture.mmd` | AWS VPC network topology |
| `security-architecture.mmd` | Security controls and authentication flows |
| `product-modularity.mmd` | Core vs optional modules and dependencies |
| `database-schema.mmd` | Complete Entity-Relationship Diagram |
| `cicd-pipeline.mmd` | GitHub Actions CI/CD workflow |
| `diagrams.md` | Index of all diagrams with descriptions |
| `README.md` | This file |

---

## 🚀 Quick Start

### Viewing Diagrams

#### Option 1: Mermaid Live Editor (Recommended)
1. Go to https://mermaid.live
2. Copy the content of any `.mmd` file
3. Paste into the editor
4. View and export as PNG/SVG

#### Option 2: GitHub/GitLab
- GitHub and GitLab natively render Mermaid diagrams in Markdown files
- Simply view the `.mmd` files in the repository

#### Option 3: VS Code
1. Install the **Markdown Preview Mermaid Support** extension
2. Open any `.mmd` file
3. Use `Ctrl+Shift+V` to preview

#### Option 4: Mermaid CLI
```bash
# Install Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Generate PNG from MMD file
mmdc -i enterprise-architecture.mmd -o enterprise-architecture.png

# Generate SVG
mmdc -i enterprise-architecture.mmd -o enterprise-architecture.svg

# Generate with custom theme
mmdc -i soa-architecture.mmd -o soa-architecture.png -t dark
```

---

## 🎨 Diagram Standards

### C4 Model
The architecture follows the [C4 Model](https://c4model.com/) for visualizing software architecture:
- **Level 1: Context** - System context and external dependencies
- **Level 2: Containers** - Applications and data stores
- **Level 3: Components** - Internal structure of containers

### Color Coding
| Color | Meaning |
|-------|---------|
| 🔵 Blue | System containers, databases |
| 🟢 Green | Core services, public subnets |
| 🟡 Orange/Yellow | Optional modules, app tier |
| 🔴 Red | Production environment, security alerts |
| 🟣 Purple | External systems, shared libraries |
| ⚪ Gray | Infrastructure, networking |

### Notation
- **Solid arrows (→)** : Synchronous/HTTP calls
- **Dashed arrows (-.→)** : Asynchronous/Messaging
- **Double pipes (||--o{)** : One-to-many relationships (ERD)

---

## 📊 Architecture Overview

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                     DECP Platform                           │
├─────────────────────────────────────────────────────────────┤
│  Clients        │  Web App, Mobile App, Admin Dashboard      │
├─────────────────────────────────────────────────────────────┤
│  API Layer      │  API Gateway, Load Balancer, CDN           │
├─────────────────────────────────────────────────────────────┤
│  Services       │  10 Microservices (User, Feed, Job, ...)   │
├─────────────────────────────────────────────────────────────┤
│  Data Layer     │  PostgreSQL, MongoDB, Redis, Elasticsearch │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure │  AWS EKS, VPC, RDS, S3, CloudFront         │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React.js, React Native |
| Backend | Node.js, Express, Python/FastAPI |
| Databases | PostgreSQL, MongoDB, Redis |
| Search | Elasticsearch |
| Message Queue | RabbitMQ |
| Cloud | AWS (EKS, RDS, S3, CloudFront) |
| CI/CD | GitHub Actions, Docker, Kubernetes |
| Monitoring | Prometheus, Grafana, CloudWatch |

---

## 🛠️ Editing Diagrams

### Mermaid Syntax Reference
- Official Docs: https://mermaid-js.github.io/
- Cheat Sheet: https://mermaid-js.github.io/mermaid/#/cheat-sheet

### Common Diagram Types Used
1. **flowchart** - Process flows, architecture diagrams
2. **erDiagram** - Entity relationships (database schema)
3. **subgraph** - Grouping related components

### Tips for Editing
1. **Use consistent naming** - Keep component names clear and consistent
2. **Add comments** - Use `%%` for comments explaining complex sections
3. **Group related items** - Use subgraphs to organize diagrams
4. **Test rendering** - Always verify diagrams render correctly

---

## 📦 Exporting Diagrams

### For Documentation
```bash
# Export all diagrams to PNG
for file in *.mmd; do
    mmdc -i "$file" -o "${file%.mmd}.png" -b white
done

# Export all diagrams to SVG (scalable)
for file in *.mmd; do
    mmdc -i "$file" -o "${file%.mmd}.svg"
done
```

### For Presentations
- Use **SVG** format for PowerPoint/Keynote (scalable)
- Use **PNG** with transparent background for dark themes
- Recommended resolution: 1920x1080 or higher

---

## 🔗 Related Resources

- [C4 Model](https://c4model.com/) - Visualizing software architecture
- [Mermaid Documentation](https://mermaid-js.github.io/) - Mermaid syntax guide
- [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) - Official AWS icons
- [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli) - Command-line tools

---

## 📝 License

These diagrams are created for educational purposes as part of the CO528 Applied Software Architecture course at the University of Peradeniya.

---

## 👥 Contributors

Created for the DECP Platform project by the development team.

---

## 📧 Contact

For questions or suggestions regarding these diagrams, please contact the project team.
