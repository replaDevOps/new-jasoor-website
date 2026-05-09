import { gql } from "@apollo/client";

export const GET_CATEGORIES = gql`
  query GetAllCategories($limit: Int, $offSet: Int) {
    getAllCategories(limit: $limit, offSet: $offSet) {
      totalcount
      categories {
        id
        isDigital
        name
        arabicName
      }
    }
  }
`;

export const GET_ALL_BUSINESSES = gql`
  query GetAllBusinesses(
    $limit: Int
    $offSet: Int
    $filter: BusinessFilterInput
    $sort: BusinessSortInput
  ) {
    getAllBusinesses(
      limit: $limit
      offSet: $offSet
      filter: $filter
      sort: $sort
    ) {
      businesses {
        isByTakbeer
        isSaved
        id
        image
        category {
          name
          arabicName
        }
        businessStatus
        businessTitle
        description
        revenue
        profit
        price
        capitalRecovery
        city
        district
        reference
        savedBy {
          id
        }
      }
      totalCount
    }
  }
`;

export const GET_BUSINESS_BY_CATEGORY = gql`
  query GetAllBusinessesByCategory(
    $category: String!
    $limit: Int
    $offSet: Int
    $sort: BusinessSortInput
    $filter: BusinessFilterInput
  ) {
    getAllBusinessesByCategory(
      category: $category
      limit: $limit
      offSet: $offSet
      sort: $sort
      filter: $filter
    ) {
      businesses {
        id
        image
        businessTitle
        description
        revenue
        profit
        isSaved
        price
        isByTakbeer
        capitalRecovery
        city
        district
        reference
        multiple
        savedBy {
          id
        }
        category {
          name
          arabicName
        }
      }
      totalCount
    }
  }
`;

export const GET_BUSINESS = gql`
  query GetBusinessById($getBusinessByIdId: ID!) {
    getBusinessById(id: $getBusinessByIdId) {
      numberOfFavorites
      numberOfOffers
      totalViews
      business {
        id
        image
        businessTitle
        isSupportVerified
        reference
        district
        city
        description
        foundedDate
        growthOpportunities
        isByTakbeer
        isAbleInActive
        multiple
        numberOfEmployees
        price
        profit
        profitMargen
        profittime
        reason
        capitalRecovery
        revenue
        revenueTime
        supportSession
        supportDuration
        businessStatus
        url
        isStatsVerified
        category {
          id
          name
          arabicName
        }
        savedBy {
          id
        }
        seller {
          id
        }
        assets {
          id
          isActive
          name
          price
          purchaseYear
          quantity
        }
        liabilities {
          id
          isActive
          name
          price
          purchaseYear
          quantity
        }
        inventoryItems {
          id
          isActive
          name
          price
          purchaseYear
          quantity
        }
        documents {
          id
          title
          fileName
          fileType
          filePath
          description
        }
      }
    }
  }
`;

export const GET_RANDOM_BUSINESSES = gql`
  query GetRandomBusinesses($userId: ID) {
    getRandomBusinesses(userId: $userId) {
      id
      image
      category {
        name
        arabicName
      }
      reference
      businessTitle
      description
      price
      isSaved
      isByTakbeer
      revenue
      profit
      capitalRecovery
      city
      district
    }
  }
`;

export const SAVE_BUSINESS = gql`
  mutation SaveBusiness($saveBusinessId: ID!) {
    saveBusiness(id: $saveBusinessId)
  }
`;

export const VIEW_BUSINESS = gql`
  mutation ViewBusiness($viewBusinessId: ID!) {
    viewBusiness(id: $viewBusinessId)
  }
`;

export const GET_ARTICLES = gql`
  query GetArticles($search: String) {
    getArticles(search: $search) {
      totalCount
      articles {
        id
        title
        arabicTitle
        image
        arabicBody
        body
        isArabic
        createdAt
      }
    }
  }
`;

export const GET_ARTICLE = gql`
  query GetArticle($getArticleId: ID!) {
    getArticle(id: $getArticleId) {
      id
      image
      title
      arabicTitle
      body
      arabicBody
      createdAt
      isArabic
    }
  }
`;

export const GET_FAQ = gql`
  query GetFAQs($search: String) {
    getFAQs(search: $search) {
      totalCount
      faqs {
        id
        question
        arabicQuestion
        answer
        arabicAnswer
        isArabic
      }
    }
  }
`;

export const GET_TERMS = gql`
  query GetTerms {
    getTerms {
      id
      term
      arabicTerm
      isArabic
    }
  }
`;

export const GET_NDA_TERMS = gql`
  query GetNDATerms {
    getNDATerms {
      id
      ndaTerm
      arabicNdaTerm
      isArabic
    }
  }
`;

/** Check whether the authenticated user has already signed the NDA for a specific business */
export const GET_ENDA_BY_BUSINESS_ID = gql`
  query GetEndaByBusinessId($businessId: ID) {
    getEndaByBusinessId(businessId: $businessId) {
      id
      acceptNdaTerms
      acceptPlatformTerms
      acceptCommission
      acceptedAt
      user {
        id
      }
    }
  }
`;

export const CHECK_OFFER_EXISTS = gql`
  query CheckOfferExists($businessId: ID!, $buyerId: ID!) {
    checkOfferExists(businessId: $businessId, buyerId: $buyerId) {
      exists
      isProceedToPay
    }
  }
`;

export const GET_PRIVACY_POLICY = gql`
  query GetPrivacyPolicy {
    getPrivacyPolicy {
      id
      policy
      arabicPolicy
      isArabic
    }
  }
`;

export const GET_BUSINESSES_BY_CITY = gql`
  query GetAllBusinessesByCity(
    $city: String!
    $limit: Int
    $offSet: Int
  ) {
    getAllBusinessesByCity(
      city: $city
      limit: $limit
      offSet: $offSet
    ) {
      businesses {
        id
        image
        businessTitle
        description
        revenue
        profit
        price
        capitalRecovery
        isByTakbeer
        isSaved
        multiple
        city
        district
        reference
        savedBy {
          id
        }
        category {
          name
          arabicName
        }
      }
      totalCount
    }
  }
`;

export const GET_BUSINESSES_BY_DISTRICT = gql`
  query GetAllBusinessesByDistrict(
    $district: String!
    $limit: Int
    $offSet: Int
  ) {
    getAllBusinessesByDistrict(
      district: $district
      limit: $limit
      offSet: $offSet
    ) {
      businesses {
        id
        image
        businessTitle
        description
        revenue
        profit
        price
        capitalRecovery
        isByTakbeer
        isSaved
        multiple
        city
        district
        reference
        savedBy {
          id
        }
        category {
          name
          arabicName
        }
      }
      totalCount
    }
  }
`;

export const GET_BUSINESSES_BY_PROFIT = gql`
  query GetAllBusinessesByProfit(
    $profit: [Float]!
    $limit: Int
    $offSet: Int
  ) {
    getAllBusinessesByProfit(
      profit: $profit
      limit: $limit
      offSet: $offSet
    ) {
      businesses {
        id
        image
        businessTitle
        description
        revenue
        profit
        price
        capitalRecovery
        isByTakbeer
        isSaved
        multiple
        city
        district
        reference
        savedBy {
          id
        }
        category {
          name
          arabicName
        }
      }
      totalCount
    }
  }
`;

export const GET_BUSINESSES_BY_REVENUE = gql`
  query GetAllBusinessesByRevenue(
    $revenue: [Float]!
    $limit: Int
    $offSet: Int
    $sort: BusinessSortInput
  ) {
    getAllBusinessesByRevenue(
      revenue: $revenue
      limit: $limit
      offSet: $offSet
      sort: $sort
    ) {
      businesses {
        id
        image
        businessTitle
        description
        revenue
        profit
        price
        capitalRecovery
        isByTakbeer
        isSaved
        multiple
        city
        district
        reference
        savedBy {
          id
        }
        category {
          name
          arabicName
        }
      }
      totalCount
    }
  }
`;

export const GET_SIMILAR_BUSINESS_PROFIT_GRAPH = gql`
  query SimilerBusinessAvgAnualProfit($similerBusinessAvgAnualProfitId: ID) {
    similerBusinessAvgAnualProfit(id: $similerBusinessAvgAnualProfitId) {
      totalProfit
      graph {
        profit
        year
      }
    }
  }
`;

export const GET_SUGGESTED_LISTINGS = gql`
  query GetSuggestedListings($businessId: ID!, $limit: Int) {
    getSuggestedListings(businessId: $businessId, limit: $limit) {
      id
      image
      businessTitle
      description
      price
      profit
      revenue
      isSaved
      isByTakbeer
      capitalRecovery
      city
      district
      reference
      category {
        name
        arabicName
      }
      savedBy {
        id
      }
    }
  }
`;
