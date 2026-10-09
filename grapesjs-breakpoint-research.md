# Investigação de breakpoints do GrapesJS

## Fontes oficiais consultadas

- Device Manager API: https://grapesjs.com/docs/api/device_manager.html
- Style Manager: https://grapesjs.com/docs/modules/Style-manager.html

## Constatações

- Um dispositivo GrapesJS tem `width`, para a largura do canvas, e `widthMedia`, para o valor usado na media query CSS.
- A seleção de dispositivo altera o frame do canvas; o Style Manager altera propriedades do componente selecionado.
- Estilos sem media query são a regra base e, por CSS, aplicam-se também às larguras menores. Uma regra Mobile somente substitui a propriedade dentro do seu breakpoint.
- Portanto, uma alteração em Desktop aparece em Mobile quando Mobile não possui uma sobrescrita própria para aquela propriedade. Já uma alteração em Mobile não altera Desktop, porque fica dentro de `@media`.

## Implicação para o editor

Para uma experiência de edição visual previsível, o painel deve diferenciar propriedades herdadas da regra base de propriedades sobrescritas no dispositivo atual e oferecer uma ação explícita para criar ou remover a sobrescrita do breakpoint.
