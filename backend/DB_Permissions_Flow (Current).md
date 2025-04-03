flowchart TD
    A[Anonymous User] --> B[Start Chat]
    B --> C[Create Conversation]
    C --> D[Select Scenario & Persona]
    D --> E[Exchange Messages]
    
    F[Admin User] --> G[Manage Prompts]
    G --> H[System Prompts]
    G --> I[Scenario Prompts]
    G --> J[Persona Prompts]
    G --> K[Feedback Prompts]
    
    subgraph "Database Access"
        L[RLS Policies]
        L -->|Allow Read| M[All Tables for Anonymous Users]
        L -->|Allow Write/Delete| N[Conversations & Messages for Anonymous Users]
        L -->|Allow All Operations| O[Prompt Tables for Admin Users]
    end
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style F fill:#bbf,stroke:#333,stroke-width:2px
    style L fill:#fbb,stroke:#333,stroke-width:2px