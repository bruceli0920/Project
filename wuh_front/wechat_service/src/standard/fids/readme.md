# 航显屏

## 项目描述

展示航班列表，点击筛选按钮，可以通过航班动态、航班机型对航班列表进行筛选。

## 项目启动

- 发布
    ```bash
    gulp --pub rls
    ```

- 开发联调(与后端)
    ```bash
    gulp -ws --pub dev
    ```

- 开发测试
    ```bash
    gulp -ws --pub test 打包到当前目录的 build下 并启动服务
    gulp -w --ss 打包到 wechat-service/build下 并启动服务
    ```

## 测试地址

```bash
    http://airtest.rtmap.com/ckgWechat/standard/fids/portal.html
```