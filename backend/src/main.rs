use log::info;

fn main() {
    // 初始化日志
    env_logger::init();
    
    info!("Solana DAO Backend 启动中...");
    
    println!("Hello, Solana DAO Backend!");
    
    info!("后端服务已启动");
}
