flowchart TD
    A[Anonymous User] -->|Limited Access| B[View Public Information]
    
    C[Authenticated User] --> D[Start Chat]
    D --> E[Create Conversation]
    E --> F[Select Scenario & Persona]
    F --> G[Exchange Messages]
    
    H[Admin User] --> I[Manage Prompts]
    I --> J[System Prompts]
    I --> K[Scenario Prompts]
    I --> L[Persona Prompts]
    I --> M[Feedback Prompts]
    
    N[App_Service Role] -->|Specific Read Access| O[Database Operations]
    
    subgraph "Database Access with RLS"
        P[RLS Policies]
        P -->|Read-Only Access to Public Data| A
        P -->|Access Own Conversations/Messages| C
        P -->|Manage Prompt Tables| H
        P -->|Specific Read Access| N
    end
    
    style A fill:#fdd,stroke:#333,stroke-width:2px
    style C fill:#f9f,stroke:#333,stroke-width:2px
    style H fill:#bbf,stroke:#333,stroke-width:2px
    style N fill:#dfd,stroke:#333,stroke-width:2px
    style P fill:#fbb,stroke:#333,stroke-width:2px