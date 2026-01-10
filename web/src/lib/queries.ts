import { gql } from 'urql';

// Queries
export const GET_EXPENSES = `
  query GetExpenses(
    $filter: ExpenseFilter
    $orderBy: [ExpenseOrderBy!]
    $first: Int
    $last: Int
    $before: Cursor
    $after: Cursor
  ) {
    expenseCollection(
      filter: $filter
      orderBy: $orderBy
      first: $first
      last: $last
      before: $before
      after: $after
    ) {
      edges {
        cursor
        node {
          id
          source
          amount
          date
          userId
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;


export const GET_INCOMES = gql`
  query GetIncomes(
    $filter: IncomeFilter
    $orderBy: [IncomeOrderBy!]
    $first: Int
    $last: Int
    $before: Cursor
    $after: Cursor
  ) {
    incomeCollection(
      filter: $filter
      orderBy: $orderBy
      first: $first
      last: $last
      before: $before
      after: $after
    ) {
      edges {
        cursor
        node {
          id
          source
          amount
          date
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const GET_SUMMARY = gql`
  query GetSummary($expenseFilter: ExpenseFilter, $incomeFilter: IncomeFilter) {
    expenseCollection(filter: $expenseFilter) {
      edges {
        node {
          id
          source
          amount
          date
        }
      }
    }
    incomeCollection(filter: $incomeFilter) {
      edges {
        node {
          id
          source
          amount
          date
        }
      }
    }
  }
`;

// Mutations
export const ADD_EXPENSE = gql`
  mutation AddExpense($object: ExpenseInsertInput!) {
    insertIntoExpenseCollection(objects: [$object]) {
      records {
        id
        source
        amount
        date
      }
    }
  }
`;

export const EDIT_EXPENSE = gql`
  mutation EditExpense($id: String!, $set: ExpenseUpdateInput!) {
    updateExpenseCollection(filter: {id: {eq: $id}}, set: $set) {
      records {
        id
        source
        amount
        date
      }
    }
  }
`;

export const DELETE_EXPENSE = gql`
  mutation DeleteExpense($id: UUID!) {
    deleteFromExpenseCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;

export const ADD_INCOME = gql`
  mutation AddIncome($object: IncomeInsertInput!) {
    insertIntoIncomeCollection(objects: [$object]) {
      records {
        id
        source
        amount
        date
      }
    }
  }
`;

export const EDIT_INCOME = gql`
  mutation EditIncome($id: String!, $set: IncomeUpdateInput!) {
    updateIncomeCollection(filter: {id: {eq: $id}}, set: $set) {
      records {
        id
        source
        amount
        date
      }
    }
  }
`;

export const DELETE_INCOME = gql`
  mutation DeleteIncome($id: UUID!) {
    deleteFromIncomeCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;

export const ADD_USER = gql`
  mutation AddUser($object: UserInsertInput!) {
    insertIntoUserCollection(objects: [$object]) {
      records {
        id
      }
    }
  }
`;
export const GET_USERS = gql`
  query GetUsers {
    userCollection {
      edges {
        node {
          id
          email
          role
          createdAt
        }
      }
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: UUID!) {
    deleteFromUserCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;

export const GET_EPAPERS = gql`
  query GetEPapers {
    ePaperCollection(orderBy: [{ createdAt: DescNullsFirst }]) {
      edges {
        node {
          id
          title
          imageUrl
          createdAt
        }
      }
    }
  }
`;

export const GET_EPAPER_BY_ID = gql`
  query GetEPaperById($id: UUID!) {
    ePaperCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          title
          imageUrl
          createdAt
          hotspotCollection {
            edges {
              node {
                id
                x
                y
                width
                height
                title
                content
              }
            }
          }
        }
      }
    }
  }
`;

export const ADD_EPAPER = gql`
  mutation AddEPaper($object: EPaperInsertInput!) {
    insertIntoEPaperCollection(objects: [$object]) {
      records {
        id
        title
        imageUrl
      }
    }
  }
`;

export const ADD_HOTSPOT = gql`
  mutation AddHotspot($objects: [HotspotInsertInput!]!) {
    insertIntoHotspotCollection(objects: $objects) {
      records {
        id
        title
      }
    }
  }
`;

export const DELETE_EPAPER = gql`
  mutation DeleteEPaper($id: UUID!) {
    deleteFromEPaperCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;

export const GET_PROFILE = gql`
  query GetProfile($email: String!) {
    userCollection(filter: { email: { eq: $email } }) {
      edges {
        node {
          id
          email
          role
        }
      }
    }
  }
`;
