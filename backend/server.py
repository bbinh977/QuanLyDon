from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from decimal import Decimal

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
SECRET_KEY = os.environ.get('JWT_SECRET', 'aiga-pro-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Create the main app
app = FastAPI(title="AIGA OS Pro API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============================================================================
# MODELS
# ============================================================================

# Auth Models
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

# Config Models
class SystemConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # Exchange rate & fees
    exchange_rate: float = 3870.0  # Tỉ giá tệ
    weight_rate: float = 24000.0   # Đơn giá cân (VND/kg)
    # Salary config
    salary_base: float = 2340000.0
    salary_coefficient: float = 2.1
    insurance_percent: float = 10.5
    # API Keys
    gemini_api_key: Optional[str] = None
    gianghuy_token: Optional[str] = None
    # Auth settings
    require_auth: bool = False
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ConfigUpdate(BaseModel):
    exchange_rate: Optional[float] = None
    weight_rate: Optional[float] = None
    salary_base: Optional[float] = None
    salary_coefficient: Optional[float] = None
    insurance_percent: Optional[float] = None
    gemini_api_key: Optional[str] = None
    gianghuy_token: Optional[str] = None
    require_auth: Optional[bool] = None

# Customer Models
class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_code: str  # Mã KH (KH001, KH002...)
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    facebook_link: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    facebook_link: Optional[str] = None
    notes: Optional[str] = None

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    facebook_link: Optional[str] = None
    notes: Optional[str] = None

# Order Models
class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tracking_code: str  # Mã vận đơn
    customer_id: Optional[str] = None
    customer_name: str
    customer_code: Optional[str] = None  # Mã KH
    weight_kg: float = 0.0  # Cân nặng (kg)
    product_name: str
    price_yuan: float  # Giá tệ
    price_quoted: float  # Giá báo khách (VND)
    amount_received: float = 0.0  # Tiền nhận
    profit: float = 0.0  # Lãi
    status: str = "Chưa mua"  # Chưa mua / Đã mua / Đã giao / Hoàn tất
    weight_status: Optional[str] = None  # Trạng thái cân
    weight_fee_customer: float = 0.0  # Tiền cân khách trả
    weight_paid: bool = False  # Đã trả cân
    gianghuy_status: Optional[str] = None  # Trạng thái Giang Huy
    gianghuy_updated_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    tracking_code: str
    customer_id: Optional[str] = None
    customer_name: str
    customer_code: Optional[str] = None
    weight_kg: float = 0.0
    product_name: str
    price_yuan: float
    amount_received: float = 0.0
    weight_fee_customer: Optional[float] = None  # Tiền cân khách trả (làm tròn). Nếu không gửi sẽ tự tính từ weight_kg * weight_rate
    weight_paid: bool = False
    status: str = "Chưa mua"
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    tracking_code: Optional[str] = None
    customer_name: Optional[str] = None
    customer_code: Optional[str] = None
    weight_kg: Optional[float] = None
    product_name: Optional[str] = None
    price_yuan: Optional[float] = None
    amount_received: Optional[float] = None
    weight_fee_customer: Optional[float] = None
    weight_paid: Optional[bool] = None
    status: Optional[str] = None
    notes: Optional[str] = None

# Finance Models
class Finance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    amount: float
    type: str  # "Thu" / "Chi" / "[Thu] ..."
    date: datetime
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FinanceCreate(BaseModel):
    amount: float
    type: str
    date: Optional[datetime] = None
    notes: Optional[str] = None

class FinanceUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[str] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None

# Dashboard Stats
class DashboardStats(BaseModel):
    total_orders: int
    total_revenue: float
    total_profit: float
    total_weight_fee: float
    unpaid_weight_count: int
    total_debt: float
    monthly_orders: int
    today_orders: int

# ============================================================================
# AUTH UTILITIES
# ============================================================================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[User]:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user_doc:
            return None
        
        return User(**user_doc)
    except:
        return None

async def require_auth(config: SystemConfig = None):
    """Check if authentication is required based on config"""
    if config is None:
        config_doc = await db.config.find_one({}, {"_id": 0})
        if config_doc:
            config = SystemConfig(**config_doc)
    
    if config and config.require_auth:
        return True
    return False

# ============================================================================
# AUTH ENDPOINTS
# ============================================================================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name
    )
    
    user_doc = user.model_dump()
    user_doc['password'] = hash_password(user_data.password)
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Create token
    access_token = create_access_token({"sub": user.id})
    
    return Token(access_token=access_token, user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Parse created_at if it's a string
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    access_token = create_access_token({"sub": user.id})
    
    return Token(access_token=access_token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(user: User = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ============================================================================
# CONFIG ENDPOINTS
# ============================================================================

@api_router.get("/config", response_model=SystemConfig)
async def get_config():
    config_doc = await db.config.find_one({}, {"_id": 0})
    if not config_doc:
        # Create default config
        config = SystemConfig()
        doc = config.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.config.insert_one(doc)
        return config
    
    if isinstance(config_doc.get('updated_at'), str):
        config_doc['updated_at'] = datetime.fromisoformat(config_doc['updated_at'])
    
    return SystemConfig(**config_doc)

@api_router.put("/config", response_model=SystemConfig)
async def update_config(updates: ConfigUpdate):
    config_doc = await db.config.find_one({}, {"_id": 0})
    
    if not config_doc:
        config = SystemConfig()
        config_doc = config.model_dump()
    
    # Update fields
    update_data = updates.model_dump(exclude_unset=True)
    config_doc.update(update_data)
    config_doc['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.config.delete_many({})
    await db.config.insert_one(config_doc)
    
    if isinstance(config_doc['updated_at'], str):
        config_doc['updated_at'] = datetime.fromisoformat(config_doc['updated_at'])
    
    return SystemConfig(**config_doc)

# ============================================================================
# CUSTOMER ENDPOINTS
# ============================================================================

async def generate_customer_code() -> str:
    """Generate next customer code (KH001, KH002, etc.)"""
    customers = await db.customers.find({}, {"customer_code": 1}).to_list(1000)
    if not customers:
        return "KH001"
    
    max_num = 0
    for c in customers:
        code = c.get('customer_code', '')
        if code.startswith('KH'):
            try:
                num = int(code[2:])
                max_num = max(max_num, num)
            except:
                pass
    
    return f"KH{str(max_num + 1).zfill(3)}"

@api_router.get("/customers", response_model=List[Customer])
async def get_customers():
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    for c in customers:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return [Customer(**c) for c in customers]

@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate):
    customer_code = await generate_customer_code()
    customer = Customer(
        customer_code=customer_code,
        **customer_data.model_dump()
    )
    
    doc = customer.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.customers.insert_one(doc)
    return customer

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    customer_doc = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer_doc:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if isinstance(customer_doc.get('created_at'), str):
        customer_doc['created_at'] = datetime.fromisoformat(customer_doc['created_at'])
    
    return Customer(**customer_doc)

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, updates: CustomerUpdate):
    customer_doc = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer_doc:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    customer_doc.update(update_data)
    
    await db.customers.update_one({"id": customer_id}, {"$set": update_data})
    
    if isinstance(customer_doc.get('created_at'), str):
        customer_doc['created_at'] = datetime.fromisoformat(customer_doc['created_at'])
    
    return Customer(**customer_doc)

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"success": True}

# ============================================================================
# ORDER ENDPOINTS
# ============================================================================

async def calculate_order_fields(order_data: dict, config: SystemConfig) -> dict:
    """Calculate derived fields for an order"""
    price_yuan = order_data.get('price_yuan', 0)
    weight_kg = order_data.get('weight_kg', 0)
    amount_received = order_data.get('amount_received', 0)
    
    # Calculate price quoted (giá báo khách)
    price_quoted = price_yuan * config.exchange_rate
    
    # Calculate weight fee
    # User can input custom weight_fee_customer (rounded up) which overrides the auto-calculated value
    user_weight_fee = order_data.get('weight_fee_customer')
    if user_weight_fee is not None and user_weight_fee > 0:
        # User provided a custom rounded weight fee
        weight_fee_customer = float(user_weight_fee)
    else:
        # Auto-calculate based on weight_kg * weight_rate
        weight_fee_customer = weight_kg * config.weight_rate
    
    # Calculate profit
    profit = amount_received - price_quoted
    
    return {
        'price_quoted': round(price_quoted, 2),
        'weight_fee_customer': round(weight_fee_customer, 2),
        'profit': round(profit, 2)
    }

@api_router.get("/orders", response_model=List[Order])
async def get_orders(
    status: Optional[str] = None,
    customer_code: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None
):
    query = {}
    if status and status != "ALL":
        query['status'] = status
    if customer_code:
        query['customer_code'] = customer_code
    
    orders = await db.orders.find(query, {"_id": 0}).to_list(10000)
    
    # Parse dates
    for o in orders:
        if isinstance(o.get('created_at'), str):
            o['created_at'] = datetime.fromisoformat(o['created_at'])
        if isinstance(o.get('gianghuy_updated_at'), str):
            o['gianghuy_updated_at'] = datetime.fromisoformat(o['gianghuy_updated_at'])
    
    result = [Order(**o) for o in orders]
    
    # Filter by month/year if specified
    if month and year:
        result = [o for o in result if o.created_at.month == month and o.created_at.year == year]
    
    # Sort by created_at desc
    result.sort(key=lambda x: x.created_at, reverse=True)
    
    return result

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    config = await get_config()
    
    # Calculate derived fields
    data_dict = order_data.model_dump()
    calculated = await calculate_order_fields(data_dict, config)
    
    # Merge: calculated fields override input fields (especially weight_fee_customer)
    data_dict.update(calculated)
    
    order = Order(**data_dict)
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('gianghuy_updated_at'):
        doc['gianghuy_updated_at'] = doc['gianghuy_updated_at'].isoformat()
    
    await db.orders.insert_one(doc)
    return order

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order_doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order_doc:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if isinstance(order_doc.get('created_at'), str):
        order_doc['created_at'] = datetime.fromisoformat(order_doc['created_at'])
    if isinstance(order_doc.get('gianghuy_updated_at'), str):
        order_doc['gianghuy_updated_at'] = datetime.fromisoformat(order_doc['gianghuy_updated_at'])
    
    return Order(**order_doc)

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, updates: OrderUpdate):
    order_doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order_doc:
        raise HTTPException(status_code=404, detail="Order not found")
    
    config = await get_config()
    
    # Apply updates
    update_data = updates.model_dump(exclude_unset=True)
    order_doc.update(update_data)
    
    # Recalculate fields
    calculated = await calculate_order_fields(order_doc, config)
    order_doc.update(calculated)
    
    # Update in DB
    await db.orders.update_one({"id": order_id}, {"$set": {**update_data, **calculated}})
    
    # Parse dates
    if isinstance(order_doc.get('created_at'), str):
        order_doc['created_at'] = datetime.fromisoformat(order_doc['created_at'])
    if isinstance(order_doc.get('gianghuy_updated_at'), str):
        order_doc['gianghuy_updated_at'] = datetime.fromisoformat(order_doc['gianghuy_updated_at'])
    
    return Order(**order_doc)

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str):
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True}

@api_router.put("/orders/{order_id}/complete")
async def complete_order(order_id: str):
    """Mark order as completed"""
    order_doc = await db.orders.find_one({"id": order_id})
    if not order_doc:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "Hoàn tất"}})
    return {"success": True, "status": "Hoàn tất"}

# ============================================================================
# FINANCE ENDPOINTS
# ============================================================================

@api_router.get("/finance", response_model=List[Finance])
async def get_finance_records(
    month: Optional[int] = None,
    year: Optional[int] = None
):
    records = await db.finance.find({}, {"_id": 0}).to_list(10000)
    
    for r in records:
        if isinstance(r.get('date'), str):
            r['date'] = datetime.fromisoformat(r['date'])
        if isinstance(r.get('created_at'), str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    
    result = [Finance(**r) for r in records]
    
    # Filter by month/year
    if month and year:
        result = [r for r in result if r.date.month == month and r.date.year == year]
    
    # Sort by date desc
    result.sort(key=lambda x: x.date, reverse=True)
    
    return result

@api_router.post("/finance", response_model=Finance)
async def create_finance_record(finance_data: FinanceCreate):
    if not finance_data.date:
        finance_data.date = datetime.now(timezone.utc)
    
    finance = Finance(**finance_data.model_dump())
    
    doc = finance.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.finance.insert_one(doc)
    return finance

@api_router.get("/finance/{finance_id}", response_model=Finance)
async def get_finance_record(finance_id: str):
    record_doc = await db.finance.find_one({"id": finance_id}, {"_id": 0})
    if not record_doc:
        raise HTTPException(status_code=404, detail="Finance record not found")
    
    if isinstance(record_doc.get('date'), str):
        record_doc['date'] = datetime.fromisoformat(record_doc['date'])
    if isinstance(record_doc.get('created_at'), str):
        record_doc['created_at'] = datetime.fromisoformat(record_doc['created_at'])
    
    return Finance(**record_doc)

@api_router.put("/finance/{finance_id}", response_model=Finance)
async def update_finance_record(finance_id: str, updates: FinanceUpdate):
    record_doc = await db.finance.find_one({"id": finance_id}, {"_id": 0})
    if not record_doc:
        raise HTTPException(status_code=404, detail="Finance record not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    if 'date' in update_data and update_data['date']:
        update_data['date'] = update_data['date'].isoformat()
    
    record_doc.update(update_data)
    
    await db.finance.update_one({"id": finance_id}, {"$set": update_data})
    
    if isinstance(record_doc.get('date'), str):
        record_doc['date'] = datetime.fromisoformat(record_doc['date'])
    if isinstance(record_doc.get('created_at'), str):
        record_doc['created_at'] = datetime.fromisoformat(record_doc['created_at'])
    
    return Finance(**record_doc)

@api_router.delete("/finance/{finance_id}")
async def delete_finance_record(finance_id: str):
    result = await db.finance.delete_one({"id": finance_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Finance record not found")
    return {"success": True}

# ============================================================================
# DASHBOARD & STATS
# ============================================================================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(month: Optional[int] = None, year: Optional[int] = None):
    now = datetime.now(timezone.utc)
    current_month = month or now.month
    current_year = year or now.year
    
    # Get all orders
    all_orders = await get_orders()
    
    # Filter for current month
    month_orders = [o for o in all_orders if o.created_at.month == current_month and o.created_at.year == current_year]
    
    # Filter for today
    today_orders = [o for o in all_orders if o.created_at.date() == now.date()]
    
    # Calculate stats
    total_revenue = sum(o.amount_received for o in month_orders)
    total_profit = sum(o.profit for o in month_orders)
    total_weight_fee = sum(o.weight_fee_customer for o in month_orders)
    unpaid_weight_count = sum(1 for o in month_orders if not o.weight_paid and o.weight_fee_customer > 0)
    
    # Calculate total debt (money not yet received from customers)
    total_debt = sum(
        max(0, o.price_quoted + (0 if o.weight_paid else o.weight_fee_customer) - o.amount_received)
        for o in month_orders
    )
    
    return DashboardStats(
        total_orders=len(all_orders),
        total_revenue=round(total_revenue, 2),
        total_profit=round(total_profit, 2),
        total_weight_fee=round(total_weight_fee, 2),
        unpaid_weight_count=unpaid_weight_count,
        total_debt=round(total_debt, 2),
        monthly_orders=len(month_orders),
        today_orders=len(today_orders)
    )

@api_router.get("/dashboard/recent-orders", response_model=List[Order])
async def get_recent_orders(limit: int = 10):
    orders = await get_orders()
    return orders[:limit]

@api_router.get("/dashboard/top-customers")
async def get_top_customers(month: Optional[int] = None, year: Optional[int] = None, limit: int = 5):
    now = datetime.now(timezone.utc)
    current_month = month or now.month
    current_year = year or now.year
    
    orders = await get_orders()
    month_orders = [o for o in orders if o.created_at.month == current_month and o.created_at.year == current_year]
    
    # Group by customer
    customer_stats = {}
    for o in month_orders:
        key = o.customer_code or o.customer_name or "Khách lẻ"
        if key not in customer_stats:
            customer_stats[key] = {
                "customer_code": o.customer_code,
                "customer_name": o.customer_name,
                "order_count": 0,
                "total_profit": 0
            }
        customer_stats[key]["order_count"] += 1
        customer_stats[key]["total_profit"] += o.profit
    
    # Sort by order count
    top = sorted(customer_stats.values(), key=lambda x: x["order_count"], reverse=True)[:limit]
    
    return top

# ============================================================================
# GIANG HUY TRACKING
# ============================================================================

@api_router.get("/tracking/gianghuy/{tracking_code}")
async def track_gianghuy(tracking_code: str):
    """Query Giang Huy API for tracking info"""
    config = await get_config()
    
    if not config.gianghuy_token:
        raise HTTPException(status_code=400, detail="Giang Huy token not configured")
    
    try:
        import requests
        
        url = f"https://nhaphang.gianghuy.com/api/small-package/get-by-transaction-code?TransactionCode={tracking_code}"
        headers = {
            "Authorization": f"Bearer {config.gianghuy_token}",
            "Accept": "application/json"
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return {"success": False, "error": f"Giang Huy API returned {response.status_code}"}
        
        data = response.json()
        
        # Extract item
        item = None
        if isinstance(data.get('Data'), list):
            if len(data['Data']) > 0:
                if isinstance(data['Data'][0], list):
                    item = data['Data'][0][0] if len(data['Data'][0]) > 0 else None
                else:
                    item = data['Data'][0]
        elif isinstance(data.get('data'), dict):
            item = data['data']
        
        if not item:
            return {"success": False, "error": "No tracking data found"}
        
        return {
            "success": True,
            "tracking_code": item.get('OrderTransactionCode') or item.get('TransactionCode') or tracking_code,
            "status": item.get('StatusName') or item.get('Status') or "Unknown",
            "weight": item.get('Weight') or item.get('TotalWeight') or 0,
            "shipping_fee": item.get('FeeShip') or item.get('ShipFee') or 0,
            "product_name": item.get('ProductType') or item.get('ProductName') or "",
            "timeline": item.get('TrackingHistories') or item.get('Histories') or []
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.put("/tracking/sync-order/{order_id}")
async def sync_order_with_gianghuy(order_id: str):
    """Sync order with Giang Huy tracking data"""
    order = await get_order(order_id)
    
    # Query Giang Huy
    tracking_data = await track_gianghuy(order.tracking_code)
    
    if not tracking_data.get("success"):
        raise HTTPException(status_code=400, detail=tracking_data.get("error"))
    
    # Update order
    updates = {
        "gianghuy_status": tracking_data.get("status"),
        "gianghuy_updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update weight if available
    if tracking_data.get("weight") and tracking_data.get("weight") > 0:
        updates["weight_kg"] = tracking_data.get("weight")
    
    await db.orders.update_one({"id": order_id}, {"$set": updates})
    
    return {"success": True, **tracking_data}

@api_router.post("/tracking/sync-all")
async def sync_all_orders():
    """Sync all orders with status 'Đã mua' with Giang Huy"""
    orders = await get_orders(status="Đã mua")
    
    results = []
    for order in orders:
        try:
            result = await sync_order_with_gianghuy(order.id)
            results.append({
                "order_id": order.id,
                "tracking_code": order.tracking_code,
                "success": True,
                "status": result.get("status")
            })
        except Exception as e:
            results.append({
                "order_id": order.id,
                "tracking_code": order.tracking_code,
                "success": False,
                "error": str(e)
            })
    
    return {
        "success": True,
        "total": len(orders),
        "synced": sum(1 for r in results if r["success"]),
        "results": results
    }

# ============================================================================
# AI INSIGHT (GEMINI)
# ============================================================================

@api_router.post("/ai/insight")
async def generate_ai_insight(month: Optional[int] = None, year: Optional[int] = None):
    """Generate AI insight using Gemini"""
    config = await get_config()
    
    if not config.gemini_api_key:
        raise HTTPException(status_code=400, detail="Gemini API key not configured")
    
    try:
        import requests
        
        # Get data
        now = datetime.now(timezone.utc)
        current_month = month or now.month
        current_year = year or now.year
        
        stats = await get_dashboard_stats(current_month, current_year)
        orders = await get_orders(month=current_month, year=current_year)
        top_customers = await get_top_customers(current_month, current_year)
        
        # Build prompt
        data_summary = {
            "month": f"{current_month}/{current_year}",
            "total_orders": stats.total_orders,
            "monthly_orders": stats.monthly_orders,
            "revenue": stats.total_revenue,
            "profit": stats.total_profit,
            "debt": stats.total_debt,
            "unpaid_weight_count": stats.unpaid_weight_count,
            "top_customers": top_customers,
            "status_breakdown": {
                "chua_mua": sum(1 for o in orders if o.status == "Chưa mua"),
                "da_mua": sum(1 for o in orders if o.status == "Đã mua"),
                "da_giao": sum(1 for o in orders if o.status == "Đã giao"),
                "hoan_tat": sum(1 for o in orders if o.status == "Hoàn tất")
            }
        }
        
        system_prompt = """Bạn là trợ lý vận hành cho app quản lý đơn hàng Taobao AIGA OS Pro.
Nhiệm vụ: phân tích dữ liệu kinh doanh và đưa ra nhận xét, cảnh báo, gợi ý hành động cụ thể.
Trả lời bằng tiếng Việt, ngắn gọn, thực dụng. Không dùng markdown phức tạp.

Cấu trúc:
1. TÓM TẮT THÁNG (2-3 dòng về doanh thu, lợi nhuận, đơn hàng)
2. ĐIỂM CẦN CHÚ Ý (các vấn đề cần xử lý: công nợ, chưa trả cân, đơn lãi thấp)
3. TOP KHÁCH HÀNG (khách đặt nhiều nhất)
4. GỢI Ý HÀNH ĐỘNG (2-3 việc cụ thể nên làm)"""
        
        user_prompt = f"Hãy phân tích dữ liệu kinh doanh sau:\n\n{data_summary}"
        
        # Call Gemini API
        gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"
        
        payload = {
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": [{
                "role": "user",
                "parts": [{"text": user_prompt}]
            }],
            "generationConfig": {
                "temperature": 0.15,
                "topP": 0.8,
                "maxOutputTokens": 2000
            }
        }
        
        headers = {
            "x-goog-api-key": config.gemini_api_key,
            "Content-Type": "application/json"
        }
        
        response = requests.post(gemini_url, json=payload, headers=headers, timeout=30)
        
        if response.status_code != 200:
            return {"success": False, "error": f"Gemini API error: {response.status_code}"}
        
        result = response.json()
        
        # Extract text
        candidates = result.get('candidates', [])
        if not candidates:
            return {"success": False, "error": "No response from Gemini"}
        
        content = candidates[0].get('content', {})
        parts = content.get('parts', [])
        text = ' '.join(p.get('text', '') for p in parts).strip()
        
        if not text:
            return {"success": False, "error": "Empty response from Gemini"}
        
        return {
            "success": True,
            "insight": text,
            "data_summary": data_summary
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.post("/ai/chat")
async def chat_with_ai(question: str, month: Optional[int] = None, year: Optional[int] = None):
    """Ask AI a question about the business data"""
    config = await get_config()
    
    if not config.gemini_api_key:
        raise HTTPException(status_code=400, detail="Gemini API key not configured")
    
    try:
        import requests
        
        # Get data context
        now = datetime.now(timezone.utc)
        current_month = month or now.month
        current_year = year or now.year
        
        stats = await get_dashboard_stats(current_month, current_year)
        
        data_context = {
            "month": f"{current_month}/{current_year}",
            "total_orders": stats.total_orders,
            "monthly_orders": stats.monthly_orders,
            "revenue": stats.total_revenue,
            "profit": stats.total_profit,
            "debt": stats.total_debt
        }
        
        system_prompt = """Bạn là trợ lý AI cho AIGA OS Pro - app quản lý đơn hàng Taobao.
Trả lời câu hỏi dựa trên dữ liệu được cung cấp. Nếu thiếu dữ liệu thì nói rõ.
Trả lời ngắn gọn bằng tiếng Việt, tập trung vào con số và hành động cụ thể."""
        
        user_prompt = f"Dữ liệu hiện tại:\n{data_context}\n\nCâu hỏi: {question}"
        
        # Call Gemini
        gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"
        
        payload = {
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": [{
                "role": "user",
                "parts": [{"text": user_prompt}]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 800
            }
        }
        
        headers = {
            "x-goog-api-key": config.gemini_api_key,
            "Content-Type": "application/json"
        }
        
        response = requests.post(gemini_url, json=payload, headers=headers, timeout=20)
        
        if response.status_code != 200:
            return {"success": False, "error": f"Gemini API error: {response.status_code}"}
        
        result = response.json()
        candidates = result.get('candidates', [])
        if not candidates:
            return {"success": False, "error": "No response"}
        
        content = candidates[0].get('content', {})
        parts = content.get('parts', [])
        text = ' '.join(p.get('text', '') for p in parts).strip()
        
        return {
            "success": True,
            "answer": text
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================================
# ROOT & HEALTH
# ============================================================================

@api_router.get("/")
async def root():
    return {
        "message": "AIGA OS Pro API",
        "version": "1.0.0",
        "status": "running"
    }

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
