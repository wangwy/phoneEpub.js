phoneEpub.js
-------------------------
![phoneEpub.js views](http://wangwy.github.io/phoneEpub.js/app/img/GIFEncoder.gif)

本项目模仿自https://github.com/futurepress/epub.js，本项目只是展示EPUB格式的电子书，解析电子书需自己写。
展示电子书所需格式
```javascript
var spine = [
{
    href: "Text/Cover.xhtml",
    id: "Cover.xhtml",
    index: 0,
    chapterNames: [
      {chapterName: "封面", path: "Text/Cover.xhtml"}
    ],
    url: "/app/books/epub0/OEBPS/Text/Cover.xhtml"
  },
  {
    href: "Text/Copyright.xhtml",
    id: "Copyright.xhtml",
    index: 1,
    chapterNames: [
      {chapterName: "版权信息", path: "Text/Copyright.xhtml"}
    ],
    url: "/app/books/epub0/OEBPS/Text/Copyright.xhtml"
  },
  ...
]
```

本地运行
-------------------------

安装 [node.js](http://nodejs.org/)

然后用npm安装项目所依赖的包

```javascript
sudo npm install
```
安装bower
```javascript
npm install bower -g
```
安装rsvp依赖包
```javascript
bower install
```
启动node
```javascript
node server.js
```
访问页面
```javascript
http://localhost:8080/app/html/phone.html
```

在线预览
------------------------
+ [chrome手机模式预览]http://wangwy.github.io/phoneEpub.js/app/html/phone.html

接口说明
------------------------
初始化书籍
```javascript
var book = initReader(options)
```

参数options说明
```javascript
{
 spine: [],     解析书脊(content.opf)后的数据，需后台解析
 padding: {
    top: 30,    上边距
    right: 10,  右边距
    bottom: 30, 下边距
    left: 10    左边距
 },
 path: {
    bookPath: "/app/books/epub0/",  电子书所在的路径
    basePath: "OEBPS/"              书脊文件(content.opf)所在书的目录
 },
 chaptersNum: {},   各个章节的页码及总页码
 fontSize: 18,      字体大小
 fontFamily: "",    字体
 headTags: [],      添加css或者js
 nightMode: 0,      日间/夜间模式
 offsetObj:{        根据偏移量跳转到相应位置
    spinePos: 2,    第几章节
    offset: 13      第几个偏移量
 }
}
```